import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { comparePassword, hashPassword } from "../utils/hash";
import { signToken } from "../utils/jwt";
import { ApiError } from "../middleware/errorHandler";
import { env } from "../utils/env";
import { TOKEN_COOKIE_NAME } from "../middleware/auth";
import { issueCsrfCookie } from "../middleware/csrf";
import { LoginInput, ChangePasswordInput } from "../validators/auth.validators";

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

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { userId },
      include: { member: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new ApiError(401, "Invalid credentials");
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = signToken({
      id: user.id,
      userId: user.userId,
      role: user.role,
      memberId: user.member?.id,
    });

    setAuthCookie(res, token);
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
