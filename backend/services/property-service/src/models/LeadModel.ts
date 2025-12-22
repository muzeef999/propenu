import mongoose, { Schema, Model } from "mongoose";
import { ILead } from "../types/leadTypes";
import { LEAD_PROPERTY_TYPES, LEAD_STATUSES } from "../zod/leadZod";

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true },

    projectId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    propertyType: {
      type: String,
      enum: [...LEAD_PROPERTY_TYPES],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [...LEAD_STATUSES],
      default: "new",
      index: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    approvedByManager: {
      type: Boolean,
      default: false,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

/* ✅ SAFE MODEL EXPORT (FINAL) */
export const Lead: Model<ILead> =
  mongoose.models.Lead ??
  mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
