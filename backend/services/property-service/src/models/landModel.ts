// src/models/property/land.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { BaseFields, FileRefSchema } from "./sharedSchemas";
import {
  ILand,
  LAND_PROPERTY_SUBTYPES,
  LAND_PROPERTY_TYPES,
} from "../types/landTypes";
import { IBaseListing, TEXT_INDEX_FIELDS } from "../types/sharedTypes";

const LandSchema = new Schema<ILand>(
  {
    ...BaseFields,
    plotArea: Number,
    plotAreaUnit: {
      type: String,
      enum: ["sqft"],
    },
    roadWidthFt: Number,
    negotiable: { type: Boolean, default: false },
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
    length: { type: Number, required: true },
    width: { type: Number, required: true },
  },
    propertyType: { type: String, enum: LAND_PROPERTY_TYPES },
    propertySubType: { type: String, enum: LAND_PROPERTY_SUBTYPES },
  },
  { timestamps: true }
);

LandSchema.index(TEXT_INDEX_FIELDS, { name: "Land_Text" });
LandSchema.index({ city: 1, plotArea: 1 }, { name: "Land_PlotArea" });

LandSchema.pre<IBaseListing>("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export const LandPlot: Model<ILand> =
  (mongoose.models && (mongoose.models as any)["LandPlot"]) ||
  mongoose.model<ILand>("LandPlot", LandSchema);

export default LandPlot;
