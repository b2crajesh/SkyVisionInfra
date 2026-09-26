import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "./env";

export interface JwtPayload {
  id: string; // User.id
  userId: string; // User.userId (login id)
  role: "ADMIN" | "MEMBER";
  memberId?: string;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
