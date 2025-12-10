// src/middlewares/parseJsonFields.ts
import { Request, Response, NextFunction } from "express";

export function parseJsonFields(keys: string[]) {
  const arrayKeyRegex = /gallery|summary|list|items|places|bhk|documents/i;

  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.body) return next();

    // optional debug info
    (req as any)._jsonParseErrors = (req as any)._jsonParseErrors || {};

    for (const key of keys) {
      const raw = (req.body as any)[key];
      if (raw === undefined || raw === null) continue;

      // if already object/array, coerce single object -> array for array-like keys
      if (typeof raw === "object") {
        if (!Array.isArray(raw) && arrayKeyRegex.test(key)) {
          (req.body as any)[key] = [raw];
        }
        continue;
      }

      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed === "") {
          (req.body as any)[key] = undefined;
          continue;
        }
        const looksLikeJson =
          (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
          (trimmed.startsWith("[") && trimmed.endsWith("]"));

        if (!looksLikeJson) {
          // not JSON-like — leave string as-is (validation will reject if required)
          continue;
        }

        try {
          const parsed = JSON.parse(trimmed);
          (req.body as any)[key] =
            arrayKeyRegex.test(key) && parsed && !Array.isArray(parsed) && typeof parsed === "object"
              ? [parsed]
              : parsed;
        } catch (err) {
          (req as any)._jsonParseErrors[key] = String(err);
          // leave raw string — validation will produce clear error
        }
      }
    }

    return next();
  };
}
