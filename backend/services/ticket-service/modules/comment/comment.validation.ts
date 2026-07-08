import type { NextFunction, Request, Response } from "express";

const visibilities = ["public", "internal"];

const fail = (res: Response, errors: string[]) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

export const validateCommentPayload = (partial = false) =>
  (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body ?? {};

    if (!partial && (!body.message || typeof body.message !== "string")) errors.push("message is required");
    if (body.message !== undefined && typeof body.message !== "string") errors.push("message must be a string");
    if (body.visibility !== undefined && !visibilities.includes(body.visibility)) {
      errors.push("visibility must be public or internal");
    }
    if (body.attachments !== undefined && !Array.isArray(body.attachments)) errors.push("attachments must be an array");

    if (errors.length) return fail(res, errors);
    return next();
  };

