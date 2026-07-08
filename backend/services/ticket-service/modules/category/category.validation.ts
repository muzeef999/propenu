import type { NextFunction, Request, Response } from "express";

const priorities = ["low", "medium", "high", "urgent"];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const fail = (res: Response, errors: string[]) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

export const validateCategory = (partial = false) =>
  (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body ?? {};

    if (!partial && (!body.name || typeof body.name !== "string")) {
      errors.push("name is required");
    }
    if (body.name !== undefined && typeof body.name !== "string") errors.push("name must be a string");
    if (body.description !== undefined && typeof body.description !== "string") errors.push("description must be a string");
    if (body.department !== undefined && typeof body.department !== "string") errors.push("department must be a string");
    if (body.defaultPriority !== undefined && !priorities.includes(body.defaultPriority)) {
      errors.push(`defaultPriority must be one of: ${priorities.join(", ")}`);
    }
    if (body.priorityWeight !== undefined && typeof body.priorityWeight !== "number") {
      errors.push("priorityWeight must be a number");
    }

    if (typeof body.tags === "string") {
      body.tags = body.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean);
    }
    if (body.tags !== undefined && !Array.isArray(body.tags)) errors.push("tags must be an array");

    if (!body.slug && typeof body.name === "string") body.slug = slugify(body.name);
    if (body.slug !== undefined && typeof body.slug !== "string") errors.push("slug must be a string");

    if (errors.length) return fail(res, errors);
    return next();
  };

