import mongoose, { Model, Schema } from "mongoose";
import type { AttachmentDocument } from "./attachment.interface";

const actorSchema = new Schema(
  {
    userId: { type: String, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, trim: true },
  },
  { _id: false },
);

const attachmentSchema = new Schema<AttachmentDocument>(
  {
    ticketId: { type: String, required: true, trim: true, index: true },
    commentId: { type: String, trim: true, index: true },
    url: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true, index: true },
    size: { type: Number, min: 0 },
    storageKey: { type: String, trim: true },
    checksum: { type: String, trim: true },
    uploadedBy: actorSchema,
    scanStatus: {
      type: String,
      enum: ["pending", "clean", "blocked"],
      default: "pending",
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

attachmentSchema.index({ ticketId: 1, isDeleted: 1, createdAt: -1 });

export const Attachment =
  (mongoose.models.TicketAttachment as Model<AttachmentDocument> | undefined) ||
  mongoose.model<AttachmentDocument>("TicketAttachment", attachmentSchema);

