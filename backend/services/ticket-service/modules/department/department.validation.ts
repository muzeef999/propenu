import type { NextFunction, Request, Response } from "express";

const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const fail = (res: Response, errors: string[]) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

export const validateDepartment = (partial = false) =>
  (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body ?? {};

    if (!partial && (!body.name || typeof body.name !== "string")) errors.push("name is required");
    if (body.name !== undefined && typeof body.name !== "string") errors.push("name must be a string");
    if (body.description !== undefined && typeof body.description !== "string") errors.push("description must be a string");
    if (body.email !== undefined && typeof body.email !== "string") errors.push("email must be a string");
    if (body.phone !== undefined && typeof body.phone !== "string") errors.push("phone must be a string");
    if (body.members !== undefined && !Array.isArray(body.members)) errors.push("members must be an array");

    if (body.escalationPolicy && typeof body.escalationPolicy !== "object") {
      errors.push("escalationPolicy must be an object");
    }

    if (!body.slug && typeof body.name === "string") body.slug = slugify(body.name);
    if (body.slug !== undefined && typeof body.slug !== "string") errors.push("slug must be a string");

    if (errors.length) return fail(res, errors);
    return next();
  };

