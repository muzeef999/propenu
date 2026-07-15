import type { Request, Response, NextFunction } from "express";
import {
  ticketPriorities,
  ticketSources,
  ticketStatuses,
  ticketVisibility,
} from "./ticket.constants";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optionalString = (value: unknown, field: string, errors: string[]) => {
  if (value !== undefined && typeof value !== "string") {
    errors.push(`${field} must be a string`);
  }
};

const requiredString = (value: unknown, field: string, errors: string[]) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${field} is required`);
  }
};

const validateEnum = <T extends readonly string[]>(
  value: unknown,
  field: string,
  values: T,
  errors: string[],
) => {
  if (value !== undefined && !values.includes(value as T[number])) {
    errors.push(`${field} must be one of: ${values.join(", ")}`);
  }
};

const normalizeTags = (body: Record<string, unknown>) => {
  if (typeof body.tags === "string") {
    body.tags = body.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
};

const normalizeDate = (
  body: Record<string, unknown>,
  field: string,
  errors: string[],
) => {
  const value = body[field];
  if (value === undefined || value instanceof Date) return;
  if (typeof value !== "string") {
    errors.push(`${field} must be an ISO date string`);
    return;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${field} must be a valid ISO date string`);
    return;
  }

  body[field] = parsed;
};

const validateActor = (
  value: unknown,
  field: string,
  errors: string[],
  required = false,
) => {
  if (value === undefined) {
    if (required) errors.push(`${field} is required`);
    return;
  }
  if (!isRecord(value)) {
    errors.push(`${field} must be an object`);
    return;
  }
  optionalString(value.userId, `${field}.userId`, errors);
  optionalString(value.name, `${field}.name`, errors);
  optionalString(value.email, `${field}.email`, errors);
  optionalString(value.role, `${field}.role`, errors);
};

const validateRequester = (
  value: unknown,
  field: string,
  errors: string[],
) => {
  if (!isRecord(value)) {
    errors.push(`${field} is required`);
    return;
  }
  requiredString(value.name, `${field}.name`, errors);
  optionalString(value.userId, `${field}.userId`, errors);
  optionalString(value.email, `${field}.email`, errors);
  optionalString(value.phone, `${field}.phone`, errors);
};

const validateAttachments = (
  value: unknown,
  field: string,
  errors: string[],
) => {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${field}.${index} must be an object`);
      return;
    }
    requiredString(item.url, `${field}.${index}.url`, errors);
    optionalString(item.name, `${field}.${index}.name`, errors);
    optionalString(item.mimeType, `${field}.${index}.mimeType`, errors);
    if (item.size !== undefined && typeof item.size !== "number") {
      errors.push(`${field}.${index}.size must be a number`);
    }
  });
};

const sendValidationErrors = (res: Response, errors: string[]) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

export const validateCreateTicket = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!isRecord(req.body)) {
    return sendValidationErrors(res, ["Request body must be an object"]);
  }

  const errors: string[] = [];
  normalizeTags(req.body);

  requiredString(req.body.title, "title", errors);
  requiredString(req.body.description, "description", errors);
  validateRequester(req.body.requester, "requester", errors);
  validateActor(req.body.assignedTo, "assignedTo", errors);
  validateEnum(req.body.priority, "priority", ticketPriorities, errors);
  validateEnum(req.body.source, "source", ticketSources, errors);
  optionalString(req.body.category, "category", errors);
  optionalString(req.body.department, "department", errors);
  optionalString(req.body.propertyId, "propertyId", errors);
  optionalString(req.body.bookingId, "bookingId", errors);
  normalizeDate(req.body, "dueAt", errors);
  validateAttachments(req.body.attachments, "attachments", errors);

  if (req.body.tags !== undefined && !Array.isArray(req.body.tags)) {
    errors.push("tags must be an array or comma separated string");
  }

  if (errors.length) return sendValidationErrors(res, errors);
  return next();
};

export const validateRequestCall = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!isRecord(req.body)) {
    return sendValidationErrors(res, ["Request body must be an object"]);
  }

  const errors: string[] = [];

  validateRequester(req.body.requester, "requester", errors);
  requiredString(req.body.timeSlot, "timeSlot", errors);
  requiredString(req.body.category, "category", errors);
  requiredString(req.body.subject, "subject", errors);
  optionalString(req.body.relationshipManagerName, "relationshipManagerName", errors);
  optionalString(req.body.relationshipManagerId, "relationshipManagerId", errors);
  optionalString(req.body.notes, "notes", errors);
  validateEnum(req.body.source, "source", ticketSources, errors);
  normalizeDate(req.body, "date", errors);

  if (!(req.body.date instanceof Date)) {
    errors.push("date is required");
  }

  if (errors.length) return sendValidationErrors(res, errors);
  return next();
};

export const validateUpdateTicket = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!isRecord(req.body)) {
    return sendValidationErrors(res, ["Request body must be an object"]);
  }

  const errors: string[] = [];
  normalizeTags(req.body);

  optionalString(req.body.title, "title", errors);
  optionalString(req.body.description, "description", errors);
  optionalString(req.body.category, "category", errors);
  optionalString(req.body.department, "department", errors);
  optionalString(req.body.propertyId, "propertyId", errors);
  optionalString(req.body.bookingId, "bookingId", errors);
  validateEnum(req.body.priority, "priority", ticketPriorities, errors);
  normalizeDate(req.body, "dueAt", errors);

  if (req.body.tags !== undefined && !Array.isArray(req.body.tags)) {
    errors.push("tags must be an array or comma separated string");
  }

  if (errors.length) return sendValidationErrors(res, errors);
  return next();
};

export const validateStatusChange = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors: string[] = [];
  validateEnum(req.body?.status, "status", ticketStatuses, errors);
  requiredString(req.body?.status, "status", errors);
  optionalString(req.body?.reason, "reason", errors);
  validateActor(req.body?.actor, "actor", errors);

  if (errors.length) return sendValidationErrors(res, errors);
  return next();
};

export const validateAssignment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors: string[] = [];
  validateActor(req.body?.assignedTo, "assignedTo", errors, true);
  validateActor(req.body?.actor, "actor", errors);

  if (errors.length) return sendValidationErrors(res, errors);
  return next();
};

export const validatePriorityChange = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors: string[] = [];
  validateEnum(req.body?.priority, "priority", ticketPriorities, errors);
  requiredString(req.body?.priority, "priority", errors);
  optionalString(req.body?.reason, "reason", errors);
  validateActor(req.body?.actor, "actor", errors);

  if (errors.length) return sendValidationErrors(res, errors);
  return next();
};

export const validateComment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors: string[] = [];
  requiredString(req.body?.message, "message", errors);
  validateEnum(req.body?.visibility, "visibility", ticketVisibility, errors);
  validateActor(req.body?.author, "author", errors);
  validateAttachments(req.body?.attachments, "attachments", errors);

  if (errors.length) return sendValidationErrors(res, errors);
  return next();
};
