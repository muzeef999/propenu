// src/models/property/land.model.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { BaseFields, FileRefSchema } from "./sharedSchemas";
import {
  ILand,
  LAND_PROPERTY_SUBTYPES,
  LAND_PROPERTY_TYPES,
} from "../types/landTypes";
import { TEXT_INDEX_FIELDS } from "../types/sharedTypes";
import { generateUniqueSlug, slugify } from "../utils/generateUniqueSlug";
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
      enum: ["sqft"],
    },
    roadWidthFt: Number,
    readyToConstruct: Boolean,
    waterConnection: Boolean,
    electricityConnection: Boolean,
    approvedByAuthority: { type: [String], default: [] },
    facing: String,
    cornerPlot: Boolean,
    fencing: Boolean,
    landUseZone: String,
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
    propertyType: { type: String, enum: LAND_PROPERTY_TYPES },
    propertySubType: { type: String, enum: LAND_PROPERTY_SUBTYPES },
  },
  { timestamps: true },
);

LandSchema.index(TEXT_INDEX_FIELDS, { name: "Land_Text" });

LandSchema.index({createdBy: 1, status: 1,}, {
  unique: true,
  partialFilterExpression: { status: "draft" },
  name: "uniq_land_draft_per_user",
});

LandSchema.pre("validate", async function ( next) {
  try {
          // ✅ ALWAYS rebuild title from latest data
          this.title = buildLandTitle(this);
      
          // 🚫 Do NOT generate slug for drafts
          if (this.status === "draft") {
            return next();
          }
      
          // ✅ Generate slug only once (when active)
          if (!this.slug && this.title) {
            const baseSlug = slugify(this.title);
            this.slug = await generateUniqueSlug(
              mongoose.model("LandPlot"),
              baseSlug,
              this._id,
            );
          }
      
          /* -------- LISTING SOURCE -------- */
          if (!this.listingSource && this.createdBy) {
            const User = mongoose.model("User");
            const Role = mongoose.model("Role");
      
            const user: any = await User.findById(this.createdBy)
              .select("role roleId")
              .lean();
      
            if (user?.role) this.listingSource = user.role;
            else if (user?.roleId) {
              const roleDoc: any = await Role.findById(user.roleId)
                .select("label")
                .lean();
              if (roleDoc?.label) this.listingSource = roleDoc.label;
            }
          }
      
          if (!this.listingSource) this.listingSource = "owner";
      
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
  /* -------- Plot Area -------- */
  const plotArea =
    doc.plotArea && doc.plotAreaUnit
      ? `${doc.plotArea} ${doc.plotAreaUnit}`
      : "";

  /* -------- Dimensions -------- */
  const dimensions =
    doc.dimensions?.length && doc.dimensions?.width
      ? `${doc.dimensions.length}×${doc.dimensions.width}`
      : "";

  /* -------- Property Type -------- */
  const propertyType = doc.propertyType
    ? doc.propertyType.replace(/-/g, " ")
    : "Land";

  /* -------- Property Sub-Type -------- */
  const propertySubType = doc.propertySubType
    ? doc.propertySubType.replace(/-/g, " ")
    : "";

  /* -------- Transaction Type -------- */
  const transactionType =
    doc.listingType === "rent"
      ? "for Rent"
      : doc.listingType === "lease"
      ? "for Lease"
      : "for Sale";

  /* -------- Flags -------- */
  const cornerPlot = doc.cornerPlot ? "Corner Plot" : "";
  const readyToConstruct = doc.readyToConstruct
    ? "Ready to Construct"
    : "";

  /* -------- Land / Layout Name -------- */
  const landName = doc.landName ? doc.landName : "";

  /* -------- Location -------- */
  const locality = doc.locality ?? "";
  const city = doc.city ?? "";

  return `
    ${dimensions}
    ${plotArea}
    ${cornerPlot}
    ${readyToConstruct}
    ${propertySubType}
    ${propertyType}
    ${transactionType}
    ${landName ? "in " + landName : ""}
    ${locality || city ? "in" : ""}
    ${locality}
    ${city}
  `
    .replace(/\s+/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\bin in\b/g, "in")
    .trim();
}

