import mongoose, { Schema, Document } from "mongoose";
import { LEAD_STATUSES } from "../zod/leadZod";
import { LeadPropertyType, LeadStatus } from "../types/leadTypes";

export interface IPublicLead extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  remarks?: string;
  source?: "site" | "imported";
  extraFields?: Record<string, string>;
  sourceCreatedAt?: Date;
  purchaseTimeline?: string;
  budgetRange?: string;
  propertyType?: LeadPropertyType;
  propertyModel?: string;
  listingType?: "sale" | "rent" | "lease";
  intention?: {
    question: string;
    answer: string;
  }[];
  createdAt: Date;
  status: LeadStatus;
}

const PublicLeadSchema = new Schema<IPublicLead>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "featuredProject",
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    message: { type: String },
    remarks: { type: String, trim: true },
    source: {
      type: String,
      enum: ["site", "imported"],
      default: "site",
      index: true,
    },
    extraFields: {
      type: Map,
      of: String,
      default: undefined,
    },
    sourceCreatedAt: { type: Date },
    purchaseTimeline: { type: String, trim: true },
    budgetRange: { type: String, trim: true },
    propertyType: {
      type: String,
      enum: ["featuredprojects", "residentials", "commercials", "agriculturals", "landplots"],
      index: true,
    },
    propertyModel: {
      type: String,
      enum: ["featuredProject", "FeaturedProject", "Residential", "Commercial", "Agricultural", "LandPlot"],
    },
    listingType: {
      type: String,
      enum: ["sale", "rent", "lease"],
      index: true,
    },
    intention: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true },
      },
    ],
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new_lead",
    },
  },
  { timestamps: true },
);

export default mongoose.model<IPublicLead>(
  "PublicLead",
  PublicLeadSchema,
);
