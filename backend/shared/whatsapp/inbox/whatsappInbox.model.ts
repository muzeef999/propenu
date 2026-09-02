import mongoose, { Schema, Document, Types, Model } from "mongoose";

export interface IWhatsAppConversation extends Document {
  waId: string;
  profileName?: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastDirection: "inbound" | "outbound";
  unreadCount: number;
  inboxStatus: "new" | "waiting" | "resolved";
  /** Real Cloud API traffic vs imported campaign logs */
  origin: "cloud" | "campaign_log";
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentRole?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWhatsAppMessage extends Document {
  conversationId: Types.ObjectId;
  waId: string;
  direction: "inbound" | "outbound";
  type: string;
  body: string;
  wamid?: string;
  status?: "pending" | "sent" | "delivered" | "read" | "failed";
  error?: string;
  raw?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IWhatsAppConversation>(
  {
    waId: { type: String, required: true, unique: true, index: true },
    profileName: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: { type: String, default: "" },
    lastDirection: {
      type: String,
      enum: ["inbound", "outbound"],
      default: "inbound",
    },
    unreadCount: { type: Number, default: 0 },
    inboxStatus: {
      type: String,
      enum: ["new", "waiting", "resolved"],
      default: "new",
      index: true,
    },
    assignedAgentId: { type: String, default: "", index: true },
    assignedAgentName: { type: String, default: "" },
    assignedAgentRole: { type: String, default: "" },
    origin: {
      type: String,
      enum: ["cloud", "campaign_log"],
      default: "cloud",
      index: true,
    },
  },
  { timestamps: true },
);

const MessageSchema = new Schema<IWhatsAppMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "WhatsAppConversation",
      required: true,
      index: true,
    },
    waId: { type: String, required: true, index: true },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    type: { type: String, default: "text" },
    body: { type: String, default: "" },
    wamid: { type: String, index: true },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed"],
      default: "sent",
    },
    error: String,
    raw: Schema.Types.Mixed,
  },
  { timestamps: true },
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const WhatsAppConversation: Model<IWhatsAppConversation> =
  (mongoose.models.WhatsAppConversation as Model<IWhatsAppConversation>) ||
  mongoose.model<IWhatsAppConversation>(
    "WhatsAppConversation",
    ConversationSchema,
  );

export const WhatsAppMessage: Model<IWhatsAppMessage> =
  (mongoose.models.WhatsAppMessage as Model<IWhatsAppMessage>) ||
  mongoose.model<IWhatsAppMessage>("WhatsAppMessage", MessageSchema);
