// src/middlewares/parseJsonFields.ts
import { Request, Response, NextFunction } from "express";

/**
 * parseJsonFields(keys) returns middleware that will attempt to JSON.parse
 * the given list of keys from req.body if they are strings.
 *
 * Use this after multer (so req.body contains the string fields from form-data)
 * and BEFORE validation.
 */
export function parseJsonFields(keys: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.body) return next();

    for (const key of keys) {
      const raw = (req.body as any)[key];
      if (raw === undefined || raw === null) continue;

      // If it's already an object/array, skip
      if (typeof raw !== "string") continue;

      // Try to parse JSON string; if fails, leave original string (validation will catch it)
      try {
        (req.body as any)[key] = JSON.parse(raw);
      } catch (e) {
        // leave it as string so validation will error nicely
        // optionally you can set a flag: req.body._jsonParseError = true
      }
    }

    return next();
  };
}
