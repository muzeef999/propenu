import mongoose, { Schema, Document } from "mongoose";
import { LEAD_STATUSES } from "../zod/leadZod";
import { LeadStatus } from "../types/leadTypes";

export interface IPublicLead extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source?: "site" | "imported";
  extraFields?: Record<string, string>;
  sourceCreatedAt?: Date;
  purchaseTimeline?: string;
  budgetRange?: string;
  createdAt: Date;
  status:  LeadStatus
}

const PublicLeadSchema = new Schema<IPublicLead>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "featuredProject",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    message: { type: String },
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
    status: {
          type: String,
          enum: LEAD_STATUSES,
          default: "new_lead",
        },
  },
  { timestamps: true } 
);

export default mongoose.model<IPublicLead>(
  "PublicLead",
  PublicLeadSchema
);
