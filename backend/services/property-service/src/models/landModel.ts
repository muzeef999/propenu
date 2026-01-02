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
    title: { type: String, required: true, trim: true },
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
    length: { type: Number, required: true },
    width: { type: Number, required: true },
 
  },
     landName: String,
    propertyType: { type: String, enum: LAND_PROPERTY_TYPES },
    propertySubType: { type: String, enum: LAND_PROPERTY_SUBTYPES },
  },
  { timestamps: true }
);

LandSchema.index(TEXT_INDEX_FIELDS, { name: "Land_Text" });


LandSchema.pre(
  "validate",
  async function (this: LandDocument, next) {
    try {
      /* -------- TITLE -------- */
      if (!this.title) {
        this.title = buildLandTitle(this);
      }

      /* -------- SLUG -------- */
      if (!this.slug && this.title) {
        const baseSlug = slugify(this.title);
        this.slug = await generateUniqueSlug(
          mongoose.model("Agricultural"),
          baseSlug,
          this._id
        );
      }

      /* -------- LISTING SOURCE (CORRECTED) -------- */
      if (!this.listingSource && this.createdBy) {
        const User = mongoose.model("User");
        const Role = mongoose.model("Role");

        const user: any = await User.findById(this.createdBy)
          .select("role roleId")
          .lean();

        // 1️⃣ Direct role string on user (if exists)
        if (user?.role && typeof user.role === "string") {
          this.listingSource = user.role;
        }

        // 2️⃣ Role reference → Role.label
        else if (user?.roleId) {
          const roleDoc: any = await Role.findById(user.roleId)
            .select("label")
            .lean();

          if (roleDoc?.label) {
            this.listingSource = roleDoc.label;
          }
        }
      }

      /* -------- FINAL FALLBACK -------- */
      if (!this.listingSource) {
        this.listingSource = "owner"; // only if EVERYTHING fails
      }

      next();
    } catch (err) {
      next(err as any);
    }
  }
);


export const LandPlot: Model<ILand> =
  (mongoose.models && (mongoose.models as any)["LandPlot"]) ||
  mongoose.model<ILand>("LandPlot", LandSchema);

export default LandPlot;



export function buildLandTitle(doc: any) {
  /* -------- Plot Area -------- */
  const plotArea =
    doc.plotArea && doc.plotAreaUnit
      ? `${doc.plotArea} ${doc.plotAreaUnit}`
      : "";

  /* -------- Property Type -------- */
  const propertyType = doc.propertyType
    ? doc.propertyType.replace(/-/g, " ")
    : "Land";

  /* -------- Sub Type (optional) -------- */
  const propertySubType = doc.propertySubType
    ? `(${doc.propertySubType.replace(/-/g, " ")})`
    : "";

  /* -------- Transaction Type -------- */
  const transactionType =
    doc.listingType === "rent"
      ? "for Rent"
      : doc.listingType === "lease"
      ? "for Lease"
      : "for Sale";

  /* -------- Location -------- */
  const locality = doc.locality ?? "";
  const city = doc.city ?? "";

  /* -------- Optional Flags -------- */
  const cornerPlot = doc.cornerPlot ? "Corner Plot" : "";
  const readyToConstruct = doc.readyToConstruct
    ? "Ready to Construct"
    : "";

  /* -------- Optional Layout / Land Name -------- */
  const landName = doc.dimensions?.LandName
    ? `(${doc.dimensions.LandName})`
    : "";

  return `
    ${plotArea}
    ${cornerPlot}
    ${readyToConstruct}
    ${propertyType}
    ${propertySubType}
    ${landName}
    ${transactionType}
    in ${locality}, ${city}
  `
    .replace(/\s+/g, " ")
    .replace(/\(\s*\)/g, "")
    .trim();
}
