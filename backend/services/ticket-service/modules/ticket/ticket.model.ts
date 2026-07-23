import mongoose, { Model, Schema } from "mongoose";
import {
  ticketPriorities,
  ticketSources,
  ticketStatuses,
  ticketVisibility,
} from "./ticket.constants";
import type { TicketDocument } from "./ticket.interface";

const actorSchema = new Schema(
  {
    userId: { type: String, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, trim: true },
  },
  { _id: false },
);

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number, min: 0 },
  },
  { _id: false },
);

const commentSchema = new Schema(
  {
    message: { type: String, required: true, trim: true },
    visibility: {
      type: String,
      enum: ticketVisibility,
      default: "public",
      index: true,
    },
    author: actorSchema,
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true },
);

const activitySchema = new Schema(
  {
    action: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    actor: actorSchema,
    from: { type: String, trim: true },
    to: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const requesterSchema = new Schema(
  {
    userId: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
  },
  { _id: false },
);

const ticketSchema = new Schema<TicketDocument>(
  {
    ticketCode: { type: String, required: true, trim: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, index: "text" },
    description: { type: String, required: true, trim: true, index: "text" },
    requester: { type: requesterSchema, required: true },
    category: { type: String, trim: true, index: true },
    department: { type: String, trim: true, index: true },
    propertyId: { type: String, trim: true, index: true },
    bookingId: { type: String, trim: true, index: true },
    assignedTo: actorSchema,
    status: {
      type: String,
      enum: ticketStatuses,
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ticketPriorities,
      default: "medium",
      index: true,
    },
    source: {
      type: String,
      enum: ticketSources,
      default: "web",
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    dueAt: { type: Date, index: true },
    resolvedAt: Date,
    closedAt: Date,
    lastCustomerReplyAt: Date,
    lastAgentReplyAt: Date,
    firstResponseAt: Date,
    attachments: { type: [attachmentSchema], default: [] },
    comments: { type: [commentSchema], default: [] },
    activities: { type: [activitySchema], default: [] },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

ticketSchema.index({ title: "text", description: "text", tags: "text" });
ticketSchema.index({ status: 1, priority: 1, dueAt: 1 });
ticketSchema.index({ "assignedTo.userId": 1, status: 1 });

export const Ticket =
  (mongoose.models.Ticket as Model<TicketDocument> | undefined) ||
  mongoose.model<TicketDocument>("Ticket", ticketSchema);
