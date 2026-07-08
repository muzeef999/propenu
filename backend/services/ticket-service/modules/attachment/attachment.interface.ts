import type { Document, Types } from "mongoose";
import type { TicketActor } from "../ticket";

export interface AttachmentAttrs {
  ticketId: string;
  commentId?: string;
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
  storageKey?: string;
  checksum?: string;
  uploadedBy?: TicketActor;
  scanStatus: "pending" | "clean" | "blocked";
  isDeleted: boolean;
}

export type AttachmentDocument = Document<unknown, object, AttachmentAttrs> &
  AttachmentAttrs & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

