import type { Document, Types } from "mongoose";
import type {
  ticketPriorities,
  ticketSources,
  ticketStatuses,
  ticketVisibility,
} from "./ticket.constants";

export type TicketStatus = (typeof ticketStatuses)[number];
export type TicketPriority = (typeof ticketPriorities)[number];
export type TicketSource = (typeof ticketSources)[number];
export type TicketVisibility = (typeof ticketVisibility)[number];

export interface TicketActor {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface TicketRequester {
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface TicketAttachment {
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface TicketComment {
  _id?: Types.ObjectId;
  message: string;
  visibility: TicketVisibility;
  author?: TicketActor;
  attachments: TicketAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TicketActivity {
  action: string;
  message: string;
  actor?: TicketActor;
  from?: string;
  to?: string;
  createdAt: Date;
}

export interface TicketAttrs {
  title: string;
  description: string;
  requester: TicketRequester;
  category?: string;
  department?: string;
  propertyId?: string;
  bookingId?: string;
  assignedTo?: TicketActor;
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  tags: string[];
  dueAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  lastCustomerReplyAt?: Date;
  lastAgentReplyAt?: Date;
  firstResponseAt?: Date;
  attachments: TicketAttachment[];
  comments: TicketComment[];
  activities: TicketActivity[];
  metadata?: Record<string, unknown>;
}

export type TicketDocument = Document<unknown, object, TicketAttrs> &
  TicketAttrs & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export interface TicketListQuery {
  page: number;
  limit: number;
  q?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  department?: string;
  assignedTo?: string;
  assignedRole?: string;
  assignedOrRequested?: string;
  requesterId?: string;
  requesterEmail?: string;
  propertyId?: string;
  tag?: string;
  overdue?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy: "createdAt" | "updatedAt" | "priority" | "dueAt" | "status";
  sortOrder: "asc" | "desc";
}

export interface CreateTicketInput {
  title: string;
  description: string;
  requester: TicketRequester;
  category?: string;
  department?: string;
  propertyId?: string;
  bookingId?: string;
  assignedTo?: TicketActor;
  priority?: TicketPriority;
  source?: TicketSource;
  tags?: string[];
  dueAt?: Date;
  attachments?: TicketAttachment[];
  metadata?: Record<string, unknown>;
}

export type UpdateTicketInput = Partial<
  Pick<
    TicketAttrs,
    | "title"
    | "description"
    | "category"
    | "department"
    | "propertyId"
    | "bookingId"
    | "priority"
    | "tags"
    | "dueAt"
    | "metadata"
  >
>;
