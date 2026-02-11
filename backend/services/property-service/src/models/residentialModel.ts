// src/models/property/residential.model.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  FLOORING_TYPES,
  IResidential,
  KITCHEN_TYPES,
  PROPERTY_AGE_BUCKETS,
  RESIDENTIAL_PROPERTY_TYPES,
} from "../types/residentialTypes";
import { BaseFields, FileRefSchema } from "./sharedSchemas";
import { TEXT_INDEX_FIELDS } from "../types/sharedTypes";
import { generateUniqueSlug, slugify } from "../utils/generateUniqueSlug";
import "../models/roleModel";

export interface ResidentialDocument extends Document, IResidential {
  _id: Types.ObjectId;
}
/* Schema */
const ResidentialSchema = new Schema<IResidential>(
  {
    ...BaseFields,
    bhk: { type: Number, min: 0 },
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    balconies: { type: Number, min: 0 },
    floorNumber: { type: Number, min: 0 },
    totalFloors: { type: Number, min: 0 },
    buildingName: {
      type: String,
      trim: true,
      maxlength: 120,
      index: true,
    },

    carpetArea: {
      type: Number,
      min: 0,
      validate: {
        validator: function (this: any, value: number) {
          if (!value) return true;
          return !this.builtUpArea || value <= this.builtUpArea;
        },
        message: "Carpet area cannot be greater than built-up area",
      },
    },

    builtUpArea: {
      type: Number,
      min: 0,
    },

    transactionType: { type: String, enum: ["new-sale", "resale"] },
    title: {
  type: String,
  trim: true,
  required: function (this: any) {
    return this.status !== "draft";
  },
},

    flooringType: { type: String, enum: FLOORING_TYPES },
    kitchenType: { type: String, enum: KITCHEN_TYPES },
    propertyAge: { type: String, enum: PROPERTY_AGE_BUCKETS },
    isModularKitchen: { type: Boolean, default: false },
    furnishing: {
      type: String,
      enum: ["unfurnished", "semi-furnished", "fully-furnished"],
    },
    parkingType: String,
    facing: {
      type: String,
      enum: ["east", "west", "north", "south"],
      lowercase: true,
      trim: true,
    },
    constructionStatus: {
      type: String,
      enum: ["ready-to-move", "under-construction"],
    },
    possessionDate: Date,
    parkingDetails: {
      visitorParking: Boolean,
      twoWheeler: Number,
      fourWheeler: Number,
    },
    propertyType: { type: String, enum: RESIDENTIAL_PROPERTY_TYPES },
  },
  { timestamps: true },
);

/* Indexes */
ResidentialSchema.index(TEXT_INDEX_FIELDS, { name: "Res_Text" });

ResidentialSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $type: "string" },
    },
  }
);

// 🔒 ONE ACTIVE DRAFT PER USER (MongoDB-level protection)
ResidentialSchema.index({ slug: 1 }, { unique: true });

ResidentialSchema.pre("validate", async function (next) {
  try {
    // Always rebuild title
    this.title = buildResidentialTitle(this);

    if (!this.title) {
      this.title = "residential-property";
    }

    // Always generate slug if missing (draft + active)
    if (!this.slug) {
      const baseSlug = slugify(this.title);

      this.slug = await generateUniqueSlug(
        mongoose.model("Residential"),
        baseSlug
      );
    }

    next();
  } catch (err) {
    next(err as any);
  }
});





export const Residential: Model<IResidential> =
  (mongoose.models && (mongoose.models as any)["Residential"]) ||
  mongoose.model<IResidential>("Residential", ResidentialSchema);

export default Residential;

function buildResidentialTitle(doc: any) {
  const parts: string[] = [];

  if (doc.bedrooms) parts.push(`${doc.bedrooms} BHK`);
  parts.push(doc.propertyType ?? "Residential Property");

  const listingType =
    doc.listingType === "rent"
      ? "Rent"
      : doc.listingType === "lease"
        ? "Lease"
        : "Sale";

  parts.push(`for ${listingType}`);

  const locationParts = [doc.locality, doc.city].filter(Boolean);
  if (locationParts.length > 0) {
    parts.push(`in ${locationParts.join(", ")}`);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

