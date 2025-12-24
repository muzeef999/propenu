// src/models/property/residential.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import {
  FLOORING_TYPES,
  IResidential,
  KITCHEN_TYPES,
  PROPERTY_AGE_BUCKETS,
  RESIDENTIAL_PROPERTY_TYPES,
} from "../types/residentialTypes";
import { BaseFields, FileRefSchema } from "./sharedSchemas";
import { IBaseListing, TEXT_INDEX_FIELDS } from "../types/sharedTypes";

/* Schema */
const ResidentialSchema = new Schema<IResidential>(
  {
    ...BaseFields,
    bhk: Number,
    bedrooms: Number,
    buildingName: String,
    bathrooms: Number,
    balconies: Number,
    carpetArea: Number,
    builtUpArea: Number,
    title: { type: String, required: true, trim: true },
    transactionType: {
      type: String,
      enum: ["new-sale", "resale"],
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
    floorNumber: Number,
    totalFloors: Number,
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
  { timestamps: true }
);

/* Indexes */
ResidentialSchema.index(TEXT_INDEX_FIELDS, { name: "Res_Text" });

ResidentialSchema.pre<IBaseListing>("validate", function (next) {
  // Auto-generate title ONLY if not provided
  if (!this.title) {
    this.title = buildResidentialTitle(this);
  }
  next();
});

/* Hooks */
ResidentialSchema.pre<IBaseListing>("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

ResidentialSchema.pre<IBaseListing>("validate", async function (next) {
  try {
    if (!this.listingSource && this.createdBy) {
      const User = mongoose.model("User");
      const user: any = await User.findById(this.createdBy).select("role");
      if (user && user.role) {
        this.listingSource = user.role; // 'owner' | 'agent' | 'builder' | 'admin'
      }
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
  const bhk = doc.bhk ? `${doc.bhk} BHK` : "";
  const propertyType = doc.propertyType ?? "Residential Property";
  const listingType =
    doc.listingType === "rent"
      ? "Rent"
      : doc.listingType === "lease"
      ? "Lease"
      : "Sale";

  const locality = doc.locality ?? "";
  const city = doc.city ?? "";

  return `${bhk} ${propertyType} for ${listingType}  in ${locality}, ${city}`
    .replace(/\s+/g, " ")
    .trim();
}
