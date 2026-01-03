import mongoose, { Schema, Model } from "mongoose";
import { LeadDocument, LeadSchemaShape } from "../types/leadTypes";
import { LEAD_PROPERTY_TYPES, LEAD_STATUSES } from "../zod/leadZod";

/* ✅ Schema uses CREATE INPUT type */
const LeadSchema = new Schema<LeadSchemaShape>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true },

    propertyType: {
      type: String,
      enum: LEAD_PROPERTY_TYPES,
      required: true,
      index: true,
    },

    propertyModel: {
      type: String,
      enum: [
        "FeaturedProject",
        "Residential",
        "Commercial",
        "Agricultural",
        "LandPlot",
      ],
      required: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      refPath: "propertyModel",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new",
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedByManager: {
      type: Boolean,
      default: false,
    },

    remarks: String,
  },
  { timestamps: true }
);

export const Lead = (mongoose.models.PropertyLead ??
  mongoose.model("PropertyLead", LeadSchema)) as Model<LeadDocument>;
  

export default Lead;
