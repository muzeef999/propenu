import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type PublicViewEntityType = "project" | "property";
export type PublicViewPropertyType =
  | "residential"
  | "commercial"
  | "land"
  | "agricultural";

export interface IPublicPageViewDocument extends Document {
  entityType: PublicViewEntityType;
  entityId: Types.ObjectId;
  propertyType?: PublicViewPropertyType;
  visitorId: string;
  ipHash?: string;
  userAgentHash?: string;
  pageUrl?: string;
  viewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PublicPageViewSchema = new Schema<IPublicPageViewDocument>(
  {
    entityType: {
      type: String,
      enum: ["project", "property"],
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    propertyType: {
      type: String,
      enum: ["residential", "commercial", "land", "agricultural"],
      index: true,
    },
    visitorId: { type: String, required: true, trim: true, maxlength: 128, index: true },
    ipHash: { type: String, trim: true, maxlength: 128 },
    userAgentHash: { type: String, trim: true, maxlength: 128 },
    pageUrl: { type: String, trim: true, maxlength: 2048 },
    viewedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true, minimize: true },
);

PublicPageViewSchema.index({
  entityType: 1,
  entityId: 1,
  visitorId: 1,
  viewedAt: -1,
});
PublicPageViewSchema.index(
  { viewedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 7,
    name: "public_page_view_retention_7_days",
  },
);

const PublicPageView: Model<IPublicPageViewDocument> =
  (mongoose.models.PublicPageView as Model<IPublicPageViewDocument>) ||
  mongoose.model<IPublicPageViewDocument>("PublicPageView", PublicPageViewSchema);

export default PublicPageView;
