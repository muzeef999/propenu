import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  AGRICULTURAL_PROPERTY_SUBTYPES,
  AGRICULTURAL_PROPERTY_TYPES,
  IAgricultural,
} from "../types/agriculturalTypes";
import { BaseFields, FileRefSchema, PromotionSchema } from "./sharedSchemas";
import { TEXT_INDEX_FIELDS } from "../types/sharedTypes";
import { generateUniqueSlug, slugify } from "../utils/generateUniqueSlug";
import { generatePropertyCode } from "../utils/generatePropertyCode";
import { listingFollowUpPlugin } from "../utils/listingFollowUpAssign";
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
        enum: ["sqft", "sqmt", "sqyd", "acre", "guntha", "cent", "kanal", "hectare"],
      },
    },

    promotion: {
      type: PromotionSchema,
      default: () => ({
        source: "subscription",
      }),
    },

    roadWidth: {
      value: Number, // 40
      unit: { type: String, enum: ["ft", "meter"] },
    },
    soilType: String,
    irrigationType: String,
    currentCrop: String,
    plantationAge: Number,
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

AgriculturalSchema.plugin(listingFollowUpPlugin);

AgriculturalSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $type: "string" },
    },
  },
);

AgriculturalSchema.index(TEXT_INDEX_FIELDS, { name: "Agri_Text" });
AgriculturalSchema.index({ slug: 1 }, { unique: true });

AgriculturalSchema.pre("save", async function (next) {
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

AgriculturalSchema.pre("validate", async function (next) {
  try {
    // Always rebuild title
    this.title = buildAgriculturalTitle(this);

    if (!this.title) {
      this.title = "Agricultural-property";
    }

    // Always generate slug if missing (draft + active)
    if (!this.slug) {
      const baseSlug = slugify(this.title);

      this.slug = await generateUniqueSlug(
        mongoose.model("Agricultural"),
        baseSlug,
      );
    }
    if (!this.propertyCode) {
      const propertyCode = await generatePropertyCode({
        city: this.city,
        locality: this.locality,
        category: "AGR",
      });
      if (propertyCode) this.propertyCode = propertyCode;
    }

    next();
  } catch (err) {
    next(err as any);
  }
});

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
