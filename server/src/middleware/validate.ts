import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          message: "Validation failed",
          errors: err.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
