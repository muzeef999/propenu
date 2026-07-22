import mongoose, { Document, Model, Schema, Types } from "mongoose";

export const INTERACTION_EVENT_TYPES = [
  "page_view", "page_exit", "session_heartbeat", "listing_impression",
  "featured_project_impression", "featured_project_click", "project_click",
  "project_view", "property_click", "property_view", "plot_view",
  "search_performed", "filter_applied", "search_result_click", "gallery_open",
  "gallery_image_view", "map_open", "price_calculator_used", "brochure_downloaded",
  "shortlist_added", "shortlist_removed", "compare_added", "whatsapp_clicked",
  "phone_clicked", "contact_owner_clicked", "lead_form_started", "lead_form_abandoned",
  "otp_requested", "otp_verification_failed", "site_visit_submitted", "booking_started",
] as const;

export type InteractionEventType = (typeof INTERACTION_EVENT_TYPES)[number];
export type InteractionEntityType = "project" | "property";
export type InteractionPromotionType = "normal" | "sponsored" | "featured" | "prime";

export interface IUserInteractionDocument extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  anonymousId?: string;
  eventType: InteractionEventType;
  eventCategory: string;
  entityType?: InteractionEntityType;
  projectId?: Types.ObjectId;
  propertyId?: Types.ObjectId;
  plotId?: Types.ObjectId;
  promotionType: InteractionPromotionType;
  promotionId?: Types.ObjectId;
  promotionVerified: boolean;
  promotionSnapshot?: Record<string, unknown>;
  source: string;
  placement?: string;
  position?: number;
  searchId?: string;
  searchContext?: Record<string, unknown>;
  pageUrl: string;
  previousPageUrl?: string;
  metadata?: Record<string, unknown>;
  clientTimestamp: Date;
  serverTimestamp: Date;
  userAgent?: string;
  ipHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserInteractionSchema = new Schema<IUserInteractionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sessionId: { type: String, required: true, trim: true, maxlength: 128, index: true },
  anonymousId: { type: String, trim: true, maxlength: 128, index: true },
  eventType: { type: String, enum: INTERACTION_EVENT_TYPES, required: true, index: true },
  eventCategory: { type: String, required: true, trim: true, maxlength: 80, index: true },
  entityType: { type: String, enum: ["project", "property"], index: true },
  projectId: { type: Schema.Types.ObjectId, index: true },
  propertyId: { type: Schema.Types.ObjectId, index: true },
  plotId: { type: Schema.Types.ObjectId, index: true },
  promotionType: { type: String, enum: ["normal", "sponsored", "featured", "prime"], default: "normal", index: true },
  promotionId: { type: Schema.Types.ObjectId, index: true },
  promotionVerified: { type: Boolean, default: false },
  promotionSnapshot: { type: Schema.Types.Mixed },
  source: { type: String, required: true, trim: true, maxlength: 120, index: true },
  placement: { type: String, trim: true, maxlength: 120, index: true },
  position: { type: Number, min: 0 },
  searchId: { type: String, trim: true, maxlength: 128, index: true },
  searchContext: { type: Schema.Types.Mixed },
  pageUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  previousPageUrl: { type: String, trim: true, maxlength: 2048 },
  metadata: { type: Schema.Types.Mixed },
  clientTimestamp: { type: Date, required: true },
  serverTimestamp: { type: Date, required: true, default: Date.now, index: true },
  userAgent: { type: String, maxlength: 512 },
  ipHash: { type: String, maxlength: 128 },
}, { timestamps: true, minimize: true });

UserInteractionSchema.index({ userId: 1, serverTimestamp: -1 });
UserInteractionSchema.index({ userId: 1, sessionId: 1, serverTimestamp: 1 });
UserInteractionSchema.index({ entityType: 1, projectId: 1, propertyId: 1, serverTimestamp: -1 });
UserInteractionSchema.index({ promotionType: 1, eventType: 1, serverTimestamp: -1 });
UserInteractionSchema.index({ serverTimestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90, name: "interaction_retention_90_days" });

const UserInteraction: Model<IUserInteractionDocument> =
  (mongoose.models.UserInteraction as Model<IUserInteractionDocument>) ||
  mongoose.model<IUserInteractionDocument>("UserInteraction", UserInteractionSchema);

export default UserInteraction;
