// src/models/property/land.model.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { BaseFields, FileRefSchema, PromotionSchema } from "./sharedSchemas";
import {
  ILand,
  LAND_PROPERTY_SUBTYPES,
  LAND_PROPERTY_TYPES,
} from "../types/landTypes";
import { TEXT_INDEX_FIELDS } from "../types/sharedTypes";
import { generateUniqueSlug, slugify } from "../utils/generateUniqueSlug";
import { generatePropertyCode } from "../utils/generatePropertyCode";
import "../models/roleModel";
import { create } from "domain";

export interface LandDocument extends Document, ILand {
  _id: Types.ObjectId;
}



const LandSchema = new Schema<ILand>(
  {
    ...BaseFields,
    plotArea: Number,
    plotAreaUnit: {
      type: String,
      enum: ["sqft", "sqmt", "acre", "guntha", "cent", "kanal", "hectare"],
    },
    roadWidthFt: Number,
    roadWidthUnit: {
      type: String,
      enum: ["ft", "meter"],
      default: "ft",
    },
    readyToConstruct: Boolean,
    waterConnection: Boolean,
    electricityConnection: Boolean,
    approvedByAuthority: { type: [String], default: [] },
    facing: String,
    cornerPlot: Boolean,
    fencing: Boolean,
    landUseZone: String,

    promotion: {
  type: PromotionSchema,
  default: () => ({
    source: "subscription"
  })
},

    conversionCertificateFile: FileRefSchema,
    encumbranceCertificateFile: FileRefSchema,
    soilTestReport: FileRefSchema,
    surveyNumber: String,
    layoutType: String,
    dimensions: {
      length: { type: Number },
      width: { type: Number },
    },
    landName: String,
    projectArea: { type: Number, min: 0 },
    totalTowers: { type: Number, min: 0 },
    totalUnits: { type: Number, min: 0 },
    availableUnits: { type: Number, min: 0 },
    propertyType: { type: String, enum: LAND_PROPERTY_TYPES },
    propertySubType: { type: String, enum: LAND_PROPERTY_SUBTYPES },
  },
  { timestamps: true },
);

LandSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $type: "string" },
    },
  }
);

LandSchema.index(TEXT_INDEX_FIELDS, { name: "Land_Text" });

LandSchema.pre("save", async function (next) {
  if (!this.listingSource && this.createdBy) {
    const user = await mongoose
      .model("User")
      .findById(this.createdBy)
      .select("role roleId")
      .lean();

    const explicitRole =
      typeof (user as any)?.role === "string" ? (user as any).role : undefined;

    if (explicitRole) {
      this.listingSource = explicitRole;
      return next();
    }

    const roleId = (user as any)?.roleId;
    if (roleId) {
      const roleDoc = await mongoose
        .model("Role")
        .findById(roleId)
        .select("name")
        .lean();

      if ((roleDoc as any)?.name) {
        this.listingSource = String((roleDoc as any).name);
      }
    }
  }
  next();
});

LandSchema.index({ slug: 1 }, { unique: true });


LandSchema.pre("validate", async function (next) {
  try {
    // Always rebuild title
    this.title = buildLandTitle(this);

    if (!this.title) {
      this.title = "LandPlot-property";
    }

    // Always generate slug if missing (draft + active)
    if (!this.slug) {
      const baseSlug = slugify(this.title);

      this.slug = await generateUniqueSlug(
        mongoose.model("LandPlot"),
        baseSlug
      );
    }
    if (!this.propertyCode) {
      const propertyCode = await generatePropertyCode({
        city: this.city,
        locality: this.locality,
        category: "LAN",
      });
      if (propertyCode) this.propertyCode = propertyCode;
    }

    next();
  } catch (err) {
    next(err as any);
  }
});


export const LandPlot: Model<ILand> =
  (mongoose.models && (mongoose.models as any)["LandPlot"]) ||
  mongoose.model<ILand>("LandPlot", LandSchema);

export default LandPlot;

function buildLandTitle(doc: any) {
  /* -------- Core fields only (short title) -------- */
  const dimensions =
    doc.dimensions?.length && doc.dimensions?.width
      ? `${doc.dimensions.length}×${doc.dimensions.width}`
      : "";
  const plotArea =
    doc.plotArea && doc.plotAreaUnit ? `${doc.plotArea} ${doc.plotAreaUnit}` : "";
  const propertySubType = doc.propertySubType
    ? doc.propertySubType.replace(/-/g, " ")
    : "";
  const propertyType = doc.propertyType ? doc.propertyType.replace(/-/g, " ") : "Land";

  const transactionType =
    doc.listingType === "rent"
      ? "for Rent"
      : doc.listingType === "lease"
        ? "for Lease"
        : "for Sale";

  /* -------- Location -------- */
  const locality = doc.locality ?? "";
  const city = doc.city ?? "";

  return `
    ${dimensions}
    ${plotArea}
    ${propertySubType}
    ${propertyType}
    ${transactionType}
    ${locality || city ? "in" : ""}
    ${locality},
    ${city}
  `
    .replace(/\s+/g, " ")
    .replace(/\bReady to Construct\b/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\bin in\b/g, "in")
    .trim();
}
