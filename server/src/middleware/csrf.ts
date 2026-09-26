import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { env } from "../utils/env";

export const CSRF_COOKIE = "svi_csrf";
export const CSRF_HEADER = "x-csrf-token";

/**
 * Double-submit cookie CSRF protection.
 *
 * Design notes / judgment calls:
 * - A non-httpOnly cookie carrying a random token is set whenever we issue or
 *   refresh a session (login, /me), so client-side JS can read it and echo it
 *   back in the `x-csrf-token` header on state-changing requests.
 * - We only enforce this on requests that carry the auth cookie (i.e. are
 *   already authenticated) because CSRF is only a meaningful threat once a
 *   session cookie exists for the browser to auto-attach. Truly public,
 *   unauthenticated endpoints (`POST /api/auth/login`, `POST /api/contact`)
 *   cannot be protected by a token the browser doesn't have yet, so they are
 *   exempted here; they are instead protected by rate limiting (login) and by
 *   having no side effects beyond creating a message record (contact).
 * - GET/HEAD/OPTIONS are never checked since they must stay side-effect free.
 */
export function issueCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(24).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
  });
  return token;
}

const EXEMPT_PATHS = new Set(["/api/auth/login", "/api/contact"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  if (EXEMPT_PATHS.has(req.path)) {
    next();
    return;
  }
  // Only enforce when a session cookie is present at all.
  if (!req.cookies?.svi_token) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.header(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ message: "Invalid or missing CSRF token" });
    return;
  }
  next();
}
