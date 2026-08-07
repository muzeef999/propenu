import mongoose, { Schema, Document, Types, Model } from "mongoose";

export type InviteEmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed"
  | "opened"
  | "clicked"
  | "interested"
  | "onboarded"
  | "rejected"
  | "expired"
  | "revoked";

export type InviteAssignMode = "invite_link" | "staff_direct" | "existing_builder";

export interface IEmailStatusEvent {
  status: InviteEmailStatus;
  at: Date;
  meta?: Record<string, unknown>;
}

export interface IProjectBuilderInvite extends Document {
  projectId: Types.ObjectId;
  mode: InviteAssignMode;
  email?: string;
  phone?: string;
  companyName?: string;
  contactName?: string;
  tokenHash: string;
  trackingId: string;
  emailStatus: InviteEmailStatus;
  statusHistory: IEmailStatusEvent[];
  providerMessageId?: string;
  bounceReason?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  openCount: number;
  clickCount: number;
  expiresAt: Date;
  usedAt?: Date;
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts: number;
  builderUserId?: Types.ObjectId;
  createdByStaffId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailStatusEventSchema = new Schema<IEmailStatusEvent>(
  {
    status: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const ProjectBuilderInviteSchema = new Schema<IProjectBuilderInvite>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "featuredProject",
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["invite_link", "staff_direct", "existing_builder"],
      required: true,
      index: true,
    },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true, index: true },
    companyName: { type: String, trim: true },
    contactName: { type: String, trim: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    trackingId: { type: String, required: true, unique: true, index: true },
    emailStatus: {
      type: String,
      enum: [
        "queued",
        "sent",
        "delivered",
        "bounced",
        "failed",
        "opened",
        "clicked",
        "interested",
        "onboarded",
        "rejected",
        "expired",
        "revoked",
      ],
      default: "queued",
      index: true,
    },
    statusHistory: { type: [EmailStatusEventSchema], default: [] },
    providerMessageId: { type: String },
    bounceReason: { type: String },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
    otpHash: { type: String },
    otpExpiresAt: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    builderUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    createdByStaffId: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

ProjectBuilderInviteSchema.index({ projectId: 1, isActive: 1, createdAt: -1 });
ProjectBuilderInviteSchema.index({ emailStatus: 1, sentAt: -1 });

const modelName = "ProjectBuilderInvite";
const ProjectBuilderInvite: Model<IProjectBuilderInvite> =
  (mongoose.models && (mongoose.models as any)[modelName]) ||
  mongoose.model<IProjectBuilderInvite>(modelName, ProjectBuilderInviteSchema);

export { ProjectBuilderInvite };
export default ProjectBuilderInvite;
