import mongoose, { Schema, Document } from "mongoose";
import { LEAD_STATUSES } from "../zod/leadZod";
import { LeadStatus } from "../types/leadTypes";

export interface IPublicLead extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  message?: string;
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
    message: { type: String },
    status: {
          type: String,
          enum: LEAD_STATUSES,
          default: "new",
        },
  },
  { timestamps: true } 
);

export default mongoose.model<IPublicLead>(
  "PublicLead",
  PublicLeadSchema
);