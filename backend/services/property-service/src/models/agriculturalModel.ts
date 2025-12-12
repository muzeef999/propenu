// src/models/property/agricultural.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import {
  AGRICULTURAL_PROPERTY_SUBTYPES,
  AGRICULTURAL_PROPERTY_TYPES,
  IAgricultural,
} from "../types/agriculturalTypes";
import { BaseFields, FileRefSchema } from "./sharedSchemas";
import { IBaseListing, TEXT_INDEX_FIELDS } from "../types/sharedTypes";

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
    suitableFor: String,
    plantationAge: Number,
    numberOfBorewells: Number,
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
  { timestamps: true }
);

AgriculturalSchema.index(TEXT_INDEX_FIELDS, { name: "Agri_Text" });
AgriculturalSchema.index(
  { city: 1, numberOfBorewells: 1 },
  { name: "Agri_Borewells" }
);

AgriculturalSchema.pre<IBaseListing>("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});


AgriculturalSchema.pre<IBaseListing>('validate', async function (next) {
  try {
    if (!this.listingSource && this.createdBy) {
      const User = mongoose.model('User');
      const user: any = await User.findById(this.createdBy).select('role');
      if (user && user.role) {
        this.listingSource = user.role; // 'owner' | 'agent' | 'builder' | 'admin'
      }
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
