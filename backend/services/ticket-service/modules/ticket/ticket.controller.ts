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
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
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

const normalizeRoleKey = (role = "") =>
  String(role)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** CCE desk scope: assigned + created + previously handled/reassigned. */
const isCustomerCareExecutiveRole = (role = "") => {
  const key = normalizeRoleKey(role);
  if (key.includes("customer_support_head") || key.includes("team_lead")) return false;
  return (
    key === "customer_care" ||
    key === "customer_care_executive" ||
    key === "customer_care_executives" ||
    (key.includes("customer_care") && key.includes("executive"))
  );
};

const ticketOwnedByUser = (ticket: any, userId: string) => {
  const id = String(userId || "").trim();
  if (!ticket || !id) return false;
  if (String(ticket?.assignedTo?.userId || "") === id) return true;
  if (String(ticket?.metadata?.createdByUserId || "") === id) return true;
  const involved = ticket?.metadata?.involvedAssigneeIds;
  if (Array.isArray(involved) && involved.map(String).includes(id)) return true;
  const tags = Array.isArray(ticket?.tags) ? ticket.tags.map(String) : [];
  return tags.includes(`created_by_${id}`) || tags.includes(`involved_${id}`);
};

const applyExecutiveListScope = (req: Request, options: TicketListQuery) => {
  const actor = actorFromRequest(req);
  const role = actor?.role || "";
  const userId = String(actor?.userId || "").trim();
  if (!isCustomerCareExecutiveRole(role) || !userId) return options;

  options.ownedBy = userId;
  delete options.assignedTo;
  delete options.assignedOrRequested;
  delete options.requesterId;
  delete options.assignedRole;
  return options;
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

const buildScopedTicketQuery = (req: Request): Partial<TicketListQuery> => {
  const options: Partial<TicketListQuery> = {};

  if (typeof req.query.q === "string") options.q = req.query.q;
  if (typeof req.query.status === "string") options.status = req.query.status as TicketStatus;
  if (typeof req.query.priority === "string") options.priority = req.query.priority as TicketPriority;
  if (typeof req.query.category === "string") options.category = req.query.category;
  if (typeof req.query.department === "string") options.department = req.query.department;
  if (typeof req.query.assignedTo === "string") options.assignedTo = req.query.assignedTo;
  if (typeof req.query.assignedRole === "string") options.assignedRole = req.query.assignedRole;
  if (typeof req.query.assignedOrRequested === "string") options.assignedOrRequested = req.query.assignedOrRequested;
  if (typeof req.query.ownedBy === "string") options.ownedBy = req.query.ownedBy;
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

  applyExecutiveListScope(req, options as TicketListQuery);

  return options;
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
    if (typeof req.query.ownedBy === "string") options.ownedBy = req.query.ownedBy;
    if (typeof req.query.requesterId === "string") options.requesterId = req.query.requesterId;
    if (typeof req.query.requesterEmail === "string") options.requesterEmail = req.query.requesterEmail;
    if (typeof req.query.propertyId === "string") options.propertyId = req.query.propertyId;
    if (typeof req.query.relatedProjectId === "string") options.relatedProjectId = req.query.relatedProjectId;
    if (typeof req.query.tag === "string") options.tag = req.query.tag;
    if (typeof req.query.module === "string") options.module = req.query.module;
    if (typeof req.query.requestType === "string") options.requestType = req.query.requestType;

    const overdue = toBoolean(req.query.overdue);
    if (overdue !== undefined) options.overdue = overdue;

    const openBucket = toBoolean(req.query.openBucket);
    if (openBucket !== undefined) options.openBucket = openBucket;

    const unassigned = toBoolean(req.query.unassigned);
    if (unassigned !== undefined) options.unassigned = unassigned;

    const reassigned = toBoolean(req.query.reassigned);
    if (reassigned !== undefined) options.reassigned = reassigned;

    const createdFrom = toDate(req.query.createdFrom ?? req.query.from);
    const createdTo = toDate(req.query.createdTo ?? req.query.to);
    if (createdFrom) options.createdFrom = createdFrom;
    if (createdTo) options.createdTo = createdTo;

    applyExecutiveListScope(req, options);

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

    const actor = actorFromRequest(req);
    const role = actor?.role || "";
    const userId = String(actor?.userId || "").trim();
    if (
      isCustomerCareExecutiveRole(role) &&
      userId &&
      !ticketOwnedByUser(ticket, userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only open tickets on your CCE desk",
      });
    }

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

export const getTicketSummary = async (req: Request, res: Response) => {
  try {
    const summary = await TicketService.summary(buildScopedTicketQuery(req));
    return res.json({ success: true, data: summary });
  } catch (err: any) {
    console.error("getTicketSummary:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};
