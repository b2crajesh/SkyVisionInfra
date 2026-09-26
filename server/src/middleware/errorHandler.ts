import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../utils/env";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: "Route not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  let status = 500;
  let message = "Internal server error";
  let code: string | undefined;
  let details: unknown;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      status = 409;
      code = "UNIQUE_CONSTRAINT";
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      message = `A record with this ${target} already exists`;
    } else if (err.code === "P2025") {
      status = 404;
      code = "NOT_FOUND";
      message = "Requested record was not found";
    } else {
      status = 400;
      code = err.code;
      message = "Database request error";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    status = 400;
    message = "Invalid data supplied to database layer";
  } else if (err instanceof Error) {
    message = env.isProduction ? message : err.message;
  }

  if (!env.isProduction) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    message,
    code,
    ...(env.isProduction ? {} : { details, stack: err instanceof Error ? err.stack : undefined }),
  });
}
