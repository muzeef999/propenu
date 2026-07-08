import type { FilterQuery } from "mongoose";
import { Attachment } from "./attachment.model";
import type { AttachmentDocument } from "./attachment.interface";
import { Ticket } from "../ticket";
import type { TicketActor } from "../ticket";

const cleanActor = (actor?: TicketActor) => {
  if (!actor) return undefined;
  const value: TicketActor = {};
  if (actor.userId) value.userId = actor.userId;
  if (actor.name) value.name = actor.name;
  if (actor.email) value.email = actor.email;
  if (actor.role) value.role = actor.role;
  return value;
};

export class AttachmentService {
  static async create(payload: Partial<AttachmentDocument> & { ticketId: string; url: string; name: string }) {
    const attachment = await Attachment.create({
      ...payload,
      uploadedBy: cleanActor(payload.uploadedBy),
      scanStatus: payload.scanStatus ?? "pending",
    });

    const embedded = {
      url: attachment.url,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };

    if (payload.commentId) {
      await Ticket.updateOne(
        { _id: payload.ticketId, "comments._id": payload.commentId },
        {
          $push: {
            "comments.$.attachments": embedded,
            activities: {
              action: "ticket.attachment_added",
              message: `Attachment added to comment: ${attachment.name}`,
              actor: attachment.uploadedBy,
              createdAt: new Date(),
            },
          },
        },
      );
    } else {
      await Ticket.findByIdAndUpdate(payload.ticketId, {
        $push: {
          attachments: embedded,
          activities: {
            action: "ticket.attachment_added",
            message: `Attachment added: ${attachment.name}`,
            actor: attachment.uploadedBy,
            createdAt: new Date(),
          },
        },
      });
    }

    return attachment;
  }

  static async list(query: Record<string, unknown>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 30, 1), 100);
    const filter: FilterQuery<AttachmentDocument> = { isDeleted: false };

    if (typeof query.ticketId === "string") filter.ticketId = query.ticketId;
    if (typeof query.commentId === "string") filter.commentId = query.commentId;
    if (typeof query.mimeType === "string") filter.mimeType = query.mimeType;
    if (typeof query.scanStatus === "string") filter.scanStatus = query.scanStatus;

    const [data, total] = await Promise.all([
      Attachment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Attachment.countDocuments(filter),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static get(id: string) {
    return Attachment.findById(id);
  }

  static updateScanStatus(id: string, scanStatus: "pending" | "clean" | "blocked") {
    return Attachment.findByIdAndUpdate(id, { scanStatus }, { new: true, runValidators: true });
  }

  static remove(id: string, actor?: TicketActor) {
    return Attachment.findByIdAndUpdate(
      id,
      { isDeleted: true, uploadedBy: cleanActor(actor) },
      { new: true },
    );
  }
}

