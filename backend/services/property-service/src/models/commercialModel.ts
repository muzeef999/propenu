// src/models/property/commercial.model.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { BaseFields } from "./sharedSchemas";
import {
  COMMERCIAL_PROPERTY_SUBTYPES,
  COMMERCIAL_PROPERTY_TYPES,
  FLOORING_TYPES,
  ICommercial,
  PANTRY_TYPES,
  WALL_FINISH_STATUS,
} from "../types/commercialTypes";
import { TEXT_INDEX_FIELDS } from "../types/sharedTypes";
import { generateUniqueSlug, slugify } from "../utils/generateUniqueSlug";
import "../models/roleModel";

export interface CommercialDocument extends Document, ICommercial {
  _id: Types.ObjectId;
}

const PantrySchema = new Schema(
  {
    type: {
      type: String,
      enum: PANTRY_TYPES,
    },
    insidePremises: { type: Boolean },
    shared: { type: Boolean },
  },
  { _id: false },
);

const CommercialSchema = new Schema<ICommercial>(
  {
    ...BaseFields,
    floorNumber: Number,
    totalFloors: Number,
    furnishedStatus: {
      type: String,
      enum: ["unfurnished", "semi-furnished", "fully-furnished"],
    },
    powerCapacityKw: Number,
    maintenanceCharges: Number,
    buildingName: String,
    flooringType: { type: String, enum: FLOORING_TYPES },
    wallFinishStatus: { type: String, enum: WALL_FINISH_STATUS },
    title: { type: String, required: true, trim: true },
    fireSafety: {
      fireExtinguisher: { type: Boolean },
      fireSprinklerSystem: { type: Boolean },
      fireHoseReel: { type: Boolean },
      fireHydrant: { type: Boolean },
      smokeDetector: { type: Boolean },
      fireAlarmSystem: { type: Boolean },
      fireControlPanel: { type: Boolean },
      emergencyExitSignage: { type: Boolean },
    },

    constructionStatus: {
      type: String,
      enum: ["ready-to-move", "under-construction", "new-lanch"],
    },
    tenantInfo: {
      type: [
        {
          currentTenant: String,
          leaseStart: Date,
          leaseEnd: Date,
          rent: Number,
        },
      ],
      default: [],
    },
    zoning: String,
    buildingManagement: {
      security: Boolean,
      managedBy: String,
      contact: String,
    },
    parkingDetails: {
      visitorParking: Boolean,
      twoWheeler: Number,
      fourWheeler: Number,
    },
    propertyType: {
      type: String,
      enum: COMMERCIAL_PROPERTY_TYPES,
    },
    propertySubType: {
      type: String,
      enum: COMMERCIAL_PROPERTY_SUBTYPES,
    },
    builtUpArea: Number,
    carpetArea: Number,
    cabins: Number,
    seats: Number,
    transactionType: {
      type: String,
      enum: ["new-sale", "resale"],
    },
    pantry: PantrySchema,
  },
  { timestamps: true },
);

CommercialSchema.index(TEXT_INDEX_FIELDS, { name: "Com_Text" });

CommercialSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $type: "string" },
    },
  },
);

// 🔒 ONE ACTIVE DRAFT PER USER (MongoDB-level protection)
CommercialSchema.index({ slug: 1 }, { unique: true });




CommercialSchema.pre("save", async function (next) {
  if (!this.listingSource && this.createdBy) {
    const user = await mongoose.model("User").findById(this.createdBy);
    if (user) {
      this.listingSource = user.role;
    }
  }
  next();
});


CommercialSchema.pre("validate", async function (next) {
  try {
    // Always rebuild title
    this.title = buildCommercialTitle(this);

    if (!this.title) {
      this.title = "commercial-property";
    }

    // Always generate slug if missing (draft + active)
    if (!this.slug) {
      const baseSlug = slugify(this.title);

      this.slug = await generateUniqueSlug(
        mongoose.model("Commercial"),
        baseSlug
      );
    }

    next();
  } catch (err) {
    next(err as any);
  }
});


export const Commercial: Model<ICommercial> =
  (mongoose.models && (mongoose.models as any)["Commercial"]) ||
  mongoose.model<ICommercial>("Commercial", CommercialSchema);

export default Commercial;

export function buildCommercialTitle(doc: any) {
  // Area (prefer carpet → built-up)
  const area = doc.carpetArea
    ? `${doc.carpetArea} sq ft`
    : doc.builtUpArea
      ? `${doc.builtUpArea} sq ft`
      : "";

  // Property type (office, shop, warehouse…)
  const propertyType = doc.propertyType
    ? doc.propertyType.replace(/-/g, " ")
    : "Commercial Property";

  // Subtype (optional)
  const propertySubType = doc.propertySubType
    ? doc.propertySubType.replace(/-/g, " ")
    : "";

  // Listing type (🔥 correct field)
  const listingType =
    doc.listingType === "rent"
      ? "for Rent"
      : doc.listingType === "lease"
        ? "for Lease"
        : "for Sale";

  // Pre-leased flag (optional but powerful)
  const preLeased =
    doc.transactionType === "resale" && doc.tenantInfo?.length
      ? "Pre-Leased"
      : "";

  const locality = doc.locality ?? "";
  const city = doc.city ?? "";

  return `
    ${area}
    ${preLeased}
    ${propertyType}
    ${propertySubType}
    ${listingType}
    in ${locality}, ${city}
  `
    .replace(/\s+/g, " ")
    .replace(/\(\s*\)/g, "")
    .trim();
}
