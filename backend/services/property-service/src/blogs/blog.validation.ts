import { Request, Response, NextFunction } from "express";

const requiredCreateFields = [
  "title",
  "excerpt",
  "featuredImage",
  "content",
  "author",
  "category",
  "metaTitle",
  "metaDescription",
];

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateAuthor(author: any) {
  if (!author || typeof author !== "object") {
    return "author is required";
  }

  if (!isNonEmptyString(author.name)) {
    return "author.name is required";
  }

  return null;
}

export function validateCreateBlog(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body || {};
  const issues: { path: string; message: string }[] = [];

  for (const field of requiredCreateFields) {
    if (field === "author") continue;
    if (!isNonEmptyString(body[field])) {
      issues.push({ path: field, message: `${field} is required` });
    }
  }

  const authorIssue = validateAuthor(body.author);
  if (authorIssue) {
    issues.push({ path: "author", message: authorIssue });
  }

  if (body.excerpt && String(body.excerpt).length > 300) {
    issues.push({
      path: "excerpt",
      message: "excerpt must be 300 characters or less",
    });
  }

  if (issues.length > 0) {
    console.warn("Blog create validation failed:", issues);
    return res.status(400).json({ message: "Validation failed", issues });
  }

  return next();
}

export function validateUpdateBlog(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body || {};
  const issues: { path: string; message: string }[] = [];

  if (Object.keys(body).length === 0) {
    issues.push({ path: "body", message: "At least one field is required" });
  }

  if (body.author !== undefined) {
    const authorIssue = validateAuthor(body.author);
    if (authorIssue) {
      issues.push({ path: "author", message: authorIssue });
    }
  }

  if (body.excerpt && String(body.excerpt).length > 300) {
    issues.push({
      path: "excerpt",
      message: "excerpt must be 300 characters or less",
    });
  }

  if (issues.length > 0) {
    console.warn("Blog update validation failed:", issues);
    return res.status(400).json({ message: "Validation failed", issues });
  }

  return next();
}
