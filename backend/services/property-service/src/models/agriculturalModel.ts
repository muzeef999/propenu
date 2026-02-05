import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  AGRICULTURAL_PROPERTY_SUBTYPES,
  AGRICULTURAL_PROPERTY_TYPES,
  IAgricultural,
} from "../types/agriculturalTypes";
import { BaseFields, FileRefSchema } from "./sharedSchemas";
import { TEXT_INDEX_FIELDS } from "../types/sharedTypes";
import { generateUniqueSlug, slugify } from "../utils/generateUniqueSlug";
import "../models/roleModel";

export interface AgriculturalDocument extends Document, IAgricultural {
  _id: Types.ObjectId;
}

const AgriculturalSchema = new Schema<IAgricultural>(
  {
    ...BaseFields,
    boundaryWall: Boolean,
    areaUnit: String,
    landShape: String,
    totalArea: {
      value: Number,
      unit: {
        type: String,
        enum: ["sqft", "sqmt", "acre", "guntha", "cent", "hectare"],
      },
    },
    roadWidth: {
      value: Number, // 40
      unit: { type: String, enum: ["ft", "meter"] },
    },
    soilType: String,
    irrigationType: String,
    currentCrop: String,
    landName: String,
    numberOfBorewells: Number,
    title: { type: String, required: true, trim: true },
    borewellDetails: {
      depthMeters: Number,
      yieldLpm: Number,
      drilledYear: Number,
      files: { type: [FileRefSchema], default: [] },
    },
    electricityConnection: Boolean,
    waterSource: String,
    accessRoadType: String,
    soilTestReport: FileRefSchema,
    statePurchaseRestrictions: String,
    agriculturalUseCertificate: FileRefSchema,
    propertyType: { type: String, enum: AGRICULTURAL_PROPERTY_TYPES },
    propertySubType: { type: String, enum: AGRICULTURAL_PROPERTY_SUBTYPES },
  },
  { timestamps: true },
);

AgriculturalSchema.index(TEXT_INDEX_FIELDS, { name: "Agri_Text" });
AgriculturalSchema.index(
  { city: 1, numberOfBorewells: 1 },
  { name: "Agri_Borewells" },
);

AgriculturalSchema.pre(
  "validate",
  async function (this: AgriculturalDocument, next) {
    try {
      /* -------- TITLE -------- */
      const isDraft = this.status === "draft";
      const generatedTitle = buildAgriculturalTitle(this);

      if (generatedTitle && (isDraft || !this.title)) {
        this.title = generatedTitle;
      }

      /* -------- SLUG (AUTO UPDATE WHEN TITLE CHANGES) -------- */
      if (this.isModified("title") && this.title) {
        const baseSlug = slugify(this.title);

        this.slug = await generateUniqueSlug(
          mongoose.model("Agricultural"),
          baseSlug,
          this._id,
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
  },
);

export const Agricultural: Model<IAgricultural> =
  (mongoose.models && (mongoose.models as any)["Agricultural"]) ||
  mongoose.model<IAgricultural>("Agricultural", AgriculturalSchema);

export default Agricultural;

export function buildAgriculturalTitle(doc: any) {
  const areaValue = doc.totalArea?.value;
  const areaUnit = doc.totalArea?.unit;

  const area = areaValue && areaUnit ? `${areaValue} ${areaUnit}` : "";

  const propertyType = doc.propertyType
    ? doc.propertyType.replace(/-/g, " ")
    : "Agricultural Land";

  const transactionType = "for Sale";

  const locality = doc.locality?.trim();
  const city = doc.city?.trim();

  const location =
    locality && city
      ? `in ${locality}, ${city}`
      : locality
        ? `in ${locality}`
        : city
          ? `in ${city}`
          : "";

  return `${area} ${propertyType} ${transactionType} ${location}`
    .replace(/\s+/g, " ")
    .trim();
}
