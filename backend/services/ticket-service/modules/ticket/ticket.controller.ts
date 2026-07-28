import type { Request, Response } from "express";
import type {
  TicketActor,
  TicketListQuery,
  TicketPriority,
  TicketStatus,
} from "./ticket.interface";
import { TicketService } from "./ticket.service";

const toPositiveInt = (value: unknown, fallback: number, max?: number) => {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  const rounded = Math.floor(parsed);
  return max ? Math.min(rounded, max) : rounded;
};

const toDate = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toBoolean = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const actorFromRequest = (req: Request): TicketActor | undefined => {
  const bodyActor = req.body?.actor;
  if (bodyActor && typeof bodyActor === "object") return bodyActor;

  const userId = req.header("x-user-id");
  const name = req.header("x-user-name");
  const email = req.header("x-user-email");
  const role = req.header("x-user-role");

  if (!userId && !name && !email && !role) return undefined;
  const headerActor: TicketActor = {};
  if (userId) headerActor.userId = userId;
  if (name) headerActor.name = name;
  if (email) headerActor.email = email;
  if (role) headerActor.role = role;
  return headerActor;
};

const sendNotFound = (res: Response) =>
  res.status(404).json({ success: false, message: "Ticket not found" });

export const createTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.createTicket(req.body);
    return res.status(201).json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("createTicket:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const createRequestCall = async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.createRequestCall(req.body);
    return res.status(201).json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("createRequestCall:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const sortBy =
      typeof req.query.sortBy === "string" &&
      ["createdAt", "updatedAt", "priority", "dueAt", "status"].includes(req.query.sortBy)
        ? (req.query.sortBy as TicketListQuery["sortBy"])
        : "createdAt";

    const options: TicketListQuery = {
      page: toPositiveInt(req.query.page, 1),
      limit: toPositiveInt(req.query.limit, 20, 100),
      sortBy,
      sortOrder: req.query.sortOrder === "asc" ? "asc" : "desc",
    };

    if (typeof req.query.q === "string") options.q = req.query.q;
    if (typeof req.query.status === "string") options.status = req.query.status as TicketStatus;
    if (typeof req.query.priority === "string") options.priority = req.query.priority as TicketPriority;
    if (typeof req.query.category === "string") options.category = req.query.category;
    if (typeof req.query.department === "string") options.department = req.query.department;
    if (typeof req.query.assignedTo === "string") options.assignedTo = req.query.assignedTo;
    if (typeof req.query.assignedRole === "string") options.assignedRole = req.query.assignedRole;
    if (typeof req.query.assignedOrRequested === "string") options.assignedOrRequested = req.query.assignedOrRequested;
    if (typeof req.query.requesterId === "string") options.requesterId = req.query.requesterId;
    if (typeof req.query.requesterEmail === "string") options.requesterEmail = req.query.requesterEmail;
    if (typeof req.query.propertyId === "string") options.propertyId = req.query.propertyId;
    if (typeof req.query.relatedProjectId === "string") options.relatedProjectId = req.query.relatedProjectId;
    if (typeof req.query.tag === "string") options.tag = req.query.tag;
    if (typeof req.query.module === "string") options.module = req.query.module;
    if (typeof req.query.requestType === "string") options.requestType = req.query.requestType;

    const overdue = toBoolean(req.query.overdue);
    if (overdue !== undefined) options.overdue = overdue;

    const createdFrom = toDate(req.query.createdFrom ?? req.query.from);
    const createdTo = toDate(req.query.createdTo ?? req.query.to);
    if (createdFrom) options.createdFrom = createdFrom;
    if (createdTo) options.createdTo = createdTo;

    const result = await TicketService.listTickets(options);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("getTickets:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing ticket id" });
    const ticket = await TicketService.getTicket(req.params.id);
    if (!ticket) return sendNotFound(res);
    return res.json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("getTicketById:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing ticket id" });
    const ticket = await TicketService.updateTicket(req.params.id, req.body, actorFromRequest(req));
    if (!ticket) return sendNotFound(res);
    return res.json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("updateTicket:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing ticket id" });
    const ticket = await TicketService.deleteTicket(req.params.id);
    if (!ticket) return sendNotFound(res);
    return res.json({ success: true, message: "Ticket deleted successfully" });
  } catch (err: any) {
    console.error("deleteTicket:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const changeTicketStatus = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing ticket id" });
    const ticket = await TicketService.changeStatus(
      req.params.id,
      req.body.status,
      actorFromRequest(req),
      req.body.reason,
    );
    if (!ticket) return sendNotFound(res);
    return res.json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("changeTicketStatus:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const assignTicket = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing ticket id" });
    const ticket = await TicketService.assignTicket(req.params.id, req.body.assignedTo, actorFromRequest(req));
    if (!ticket) return sendNotFound(res);
    return res.json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("assignTicket:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const changeTicketPriority = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing ticket id" });
    const ticket = await TicketService.setPriority(
      req.params.id,
      req.body.priority,
      actorFromRequest(req),
      req.body.reason,
    );
    if (!ticket) return sendNotFound(res);
    return res.json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("changeTicketPriority:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const addTicketComment = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing ticket id" });
    const ticket = await TicketService.addComment(
      req.params.id,
      req.body.message,
      req.body.visibility ?? "public",
      req.body.author ?? actorFromRequest(req),
      req.body.attachments ?? [],
    );
    if (!ticket) return sendNotFound(res);
    return res.status(201).json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("addTicketComment:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const removeTicketComment = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing ticket id" });
    if (!req.params.commentId) return res.status(400).json({ success: false, message: "Missing comment id" });
    const ticket = await TicketService.removeComment(req.params.id, req.params.commentId, actorFromRequest(req));
    if (!ticket) return sendNotFound(res);
    return res.json({ success: true, data: ticket });
  } catch (err: any) {
    console.error("removeTicketComment:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getTicketSummary = async (_req: Request, res: Response) => {
  try {
    const summary = await TicketService.summary();
    return res.json({ success: true, data: summary });
  } catch (err: any) {
    console.error("getTicketSummary:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};
