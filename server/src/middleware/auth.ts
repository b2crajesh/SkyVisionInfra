import { NextFunction, Request, Response } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const TOKEN_COOKIE = "svi_token";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}

export function authorize(...roles: Array<"ADMIN" | "MEMBER">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}

export const TOKEN_COOKIE_NAME = TOKEN_COOKIE;
