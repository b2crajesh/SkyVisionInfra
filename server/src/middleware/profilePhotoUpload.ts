import express, { NextFunction, Request, Response } from "express";
import { ApiError } from "./errorHandler";

const parser = express.raw({
  type: ["image/jpeg", "image/png", "image/webp"],
  limit: "5mb",
});

export function parseProfilePhotoUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  parser(req, res, (error?: unknown) => {
    if (
      error instanceof Error &&
      "type" in error &&
      error.type === "entity.too.large"
    ) {
      next(new ApiError(413, "Profile photos must be 5 MB or smaller"));
      return;
    }
    next(error);
  });
}
