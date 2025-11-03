import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateBody = (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // parse throws on invalid input; transforms applied
      req.body = schema.parse(req.body);
      return next();
    } catch (err: any) {
      if (err?.issues) {
        const issues = err.issues.map((i: any) => ({ path: i.path, message: i.message }));
        return res.status(400).json({ message: "Validation failed", issues });
      }
      return res.status(400).json({ message: err?.message || "Invalid request body" });
    }
  };
