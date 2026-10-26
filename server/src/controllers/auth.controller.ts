import { Request, Response, NextFunction } from "express";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../utils/prisma";
import { comparePassword, hashPassword } from "../utils/hash";
import { signToken } from "../utils/jwt";
import { ApiError } from "../middleware/errorHandler";
import { env } from "../utils/env";
import { TOKEN_COOKIE_NAME } from "../middleware/auth";
import { issueCsrfCookie } from "../middleware/csrf";
import {
  AdminRecoveryRequestInput,
  AdminRecoveryResetInput,
  LoginInput,
  ChangePasswordInput,
} from "../validators/auth.validators";
import { logError, logWarning } from "../utils/logger";
import { sendAdminPasswordRecoveryEmail } from "../services/adminPasswordRecoveryEmail";

const ADMIN_RECOVERY_RESPONSE =
  "If the admin account is eligible, a password reset link will be sent to the configured recovery email.";
const ADMIN_RECOVERY_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_RECOVERY_MAX_ATTEMPTS = 5;
const adminRecoveryAttempts = new Map<string, { count: number; resetAt: number }>();

function hashRecoveryToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function limitAdminPasswordRecovery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  for (const [key, entry] of adminRecoveryAttempts) {
    if (entry.resetAt <= now) adminRecoveryAttempts.delete(key);
  }

  const attempts = adminRecoveryAttempts.get(ip);
  if (attempts && attempts.resetAt > now && attempts.count >= ADMIN_RECOVERY_MAX_ATTEMPTS) {
    res.status(429).json({ message: "Too many recovery requests. Please try again later." });
    return;
  }

  if (attempts && attempts.resetAt > now) {
    attempts.count += 1;
  } else {
    adminRecoveryAttempts.set(ip, { count: 1, resetAt: now + ADMIN_RECOVERY_WINDOW_MS });
  }
  next();
}

export async function requestAdminPasswordRecovery(
  req: Request<unknown, unknown, AdminRecoveryRequestInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findFirst({
      where: { userId: req.body.userId, role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    if (user) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = hashRecoveryToken(token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await tx.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        });
      });

      const resetUrl = new URL("/reset-admin-password", env.CLIENT_ORIGIN);
      resetUrl.searchParams.set("token", token);
      await sendAdminPasswordRecoveryEmail(resetUrl.toString());
    }

    res.json({ message: ADMIN_RECOVERY_RESPONSE });
  } catch (err) {
    next(err);
  }
}

export async function resetAdminPassword(
  req: Request<unknown, unknown, AdminRecoveryResetInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tokenHash = hashRecoveryToken(req.body.token);
    const now = new Date();
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        user: { select: { role: true, status: true } },
      },
    });

    if (
      !resetToken ||
      resetToken.expiresAt <= now ||
      resetToken.user.role !== "ADMIN" ||
      resetToken.user.status !== "ACTIVE"
    ) {
      throw new ApiError(400, "This password reset link is invalid or expired.");
    }

    const passwordHash = await hashPassword(req.body.newPassword);
    const consumed = await prisma.$transaction(async (tx) => {
      const result = await tx.passwordResetToken.deleteMany({
        where: { id: resetToken.id, expiresAt: { gt: now } },
      });
      if (result.count !== 1) return false;

      await tx.user.update({
        where: { id: resetToken.userId, role: "ADMIN", status: "ACTIVE" },
        data: { passwordHash, mustChangePassword: false },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });
      return true;
    });

    if (!consumed) {
      throw new ApiError(400, "This password reset link is invalid or expired.");
    }
    res.json({ message: "Admin password updated. You can now sign in." });
  } catch (err) {
    next(err);
  }
}

function toClientRole(role: "ADMIN" | "MEMBER"): "admin" | "member" {
  return role === "ADMIN" ? "admin" : "member";
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
}

function logLoginDiagnostic(event: string, details: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(`[LOGIN] ${event} ${JSON.stringify(details)}`);
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  let phase = "user_lookup";
  logLoginDiagnostic("attempt_started");
  try {
    const { userId, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { userId },
      include: { member: true },
    });
    logLoginDiagnostic("user_lookup_complete", {
      found: Boolean(user),
      active: user?.status === "ACTIVE",
    });

    if (!user || user.status !== "ACTIVE") {
      throw new ApiError(401, "Invalid credentials");
    }

    phase = "password_verification";
    const valid = await comparePassword(password, user.passwordHash);
    logLoginDiagnostic("password_verification_complete", { valid });
    if (!valid) {
      throw new ApiError(401, "Invalid credentials");
    }

    phase = "token_signing";
    const token = signToken({
      id: user.id,
      userId: user.userId,
      role: user.role,
      memberId: user.member?.id,
    });
    logLoginDiagnostic("token_signing_complete");

    phase = "session_cookie";
    setAuthCookie(res, token);
    issueCsrfCookie(res);
    logLoginDiagnostic("session_cookies_issued");

    phase = "response";
    res.json({
      user: {
        id: user.id,
        userId: user.userId,
        role: toClientRole(user.role),
        memberId: user.member?.id ?? null,
        name: user.member?.name ?? null,
        memberCode: user.member?.memberCode ?? null,
        mustChangePassword: user.mustChangePassword,
      },
    });
    logLoginDiagnostic("attempt_succeeded", { role: user.role });
  } catch (err) {
    const requestId = req.get("x-request-id");
    const correlation = requestId && /^[\w-]{1,64}$/.test(requestId) ? { requestId } : {};
    const errorName = err instanceof Error ? err.name : "UnknownError";
    const errorCode =
      typeof err === "object" && err !== null && "code" in err && typeof err.code === "string"
        ? err.code
        : undefined;
    const errorMessage =
      err instanceof Error
        ? err.message
            .replace(/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/gi, "$1[REDACTED]@")
            .replace(/(password\s*[=:]\s*)[^\s,;]+/gi, "$1[REDACTED]")
        : undefined;

    if (err instanceof ApiError) {
      logLoginDiagnostic("attempt_rejected", { phase, status: err.status, ...correlation });
      logWarning("auth.login.rejected", { status: err.status, ...correlation });
    } else {
      logLoginDiagnostic("attempt_failed", {
        phase,
        errorName,
        errorCode,
        errorMessage,
        ...correlation,
      });
      logError("auth.login.failed", err, { phase, ...correlation });
    }
    next(err);
  }
}

export async function changePassword(
  req: Request<unknown, unknown, ChangePasswordInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, "Not authenticated");
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });

    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie(TOKEN_COOKIE_NAME, { path: "/" });
  res.clearCookie("svi_csrf", { path: "/" });
  res.json({ message: "Logged out" });
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, "Not authenticated");
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { member: true },
    });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    issueCsrfCookie(res);

    res.json({
      user: {
        id: user.id,
        userId: user.userId,
        role: toClientRole(user.role),
        memberId: user.member?.id ?? null,
        name: user.member?.name ?? null,
        memberCode: user.member?.memberCode ?? null,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    next(err);
  }
}
