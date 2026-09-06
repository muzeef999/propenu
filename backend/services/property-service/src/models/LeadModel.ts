import mongoose, { Schema, Model } from "mongoose";
import { LeadDocument, LeadSchemaShape } from "../types/leadTypes";
import { LEAD_PROPERTY_TYPES, LEAD_STATUSES } from "../zod/leadZod";

const PropertySnapshotSchema = new Schema(
  {
    title: { type: String, trim: true },
    code: { type: String, trim: true },
    category: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    locality: { type: String, trim: true },
    slug: { type: String, trim: true },
    heroImage: { type: String, trim: true },
    price: { type: Number, default: null },
    priceFrom: { type: Number, default: null },
    priceTo: { type: Number, default: null },
    listingType: { type: String, trim: true },
    promotionType: { type: String, trim: true },
    status: { type: String, trim: true },
  },
  { _id: false },
);

/* ✅ LEAD SCHEMA */
const LeadSchema = new Schema<LeadSchemaShape>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true },

    // 🔥 WHO created this lead (buyer/agent)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔥 WHO owns the property (owner/builder)
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔥 sale | rent (important for subscription rules)
    listingType: {
      type: String,
      enum: ["sale", "rent", "lease"],
      required: true,
      index: true,
    },

    propertyType: {
      type: String,
      enum: LEAD_PROPERTY_TYPES,
      required: true,
      index: true,
    },

    propertyModel: {
      type: String,
      enum: [
        "featuredProject",
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

    propertySnapshot: {
      type: PropertySnapshotSchema,
      default: undefined,
    },

    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new_lead",
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

/* 🔒 HARD DATABASE PROTECTION AGAINST DUPLICATES */
LeadSchema.index({ projectId: 1, createdBy: 1 }, { unique: true });

export const Lead = (mongoose.models.PropertyLead ??
  mongoose.model("PropertyLead", LeadSchema)) as Model<LeadDocument>;

export default Lead;
