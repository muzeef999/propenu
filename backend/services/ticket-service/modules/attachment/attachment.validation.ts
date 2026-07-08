import type { NextFunction, Request, Response } from "express";

const fail = (res: Response, errors: string[]) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

export const validateAttachment = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];
  const body = req.body ?? {};

  if (!body.ticketId && !req.params.ticketId) errors.push("ticketId is required");
  if (!body.url || typeof body.url !== "string") errors.push("url is required");
  if (!body.name || typeof body.name !== "string") errors.push("name is required");
  if (body.mimeType !== undefined && typeof body.mimeType !== "string") errors.push("mimeType must be a string");
  if (body.size !== undefined && typeof body.size !== "number") errors.push("size must be a number");
  if (body.scanStatus !== undefined && !["pending", "clean", "blocked"].includes(body.scanStatus)) {
    errors.push("scanStatus must be pending, clean, or blocked");
  }

  if (errors.length) return fail(res, errors);
  return next();
};

