// src/models/property/agricultural.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAgricultural } from '../types/agriculturalTypes';
import { BaseFields, FileRefSchema } from './sharedSchemas';
import { IBaseListing, TEXT_INDEX_FIELDS } from '../types/sharedTypes';

const AgriculturalSchema = new Schema<IAgricultural>(
  {
    ...BaseFields,
    boundaryWall: Boolean,
    areaUnit: String,
    landShape: String,
    soilType: String,
    irrigationType: String,
    currentCrop: String,
    suitableFor: String,
    plantationAge: Number,
    numberOfBorewells: Number,
    borewellDetails: { depthMeters: Number, yieldLpm: Number, drilledYear: Number, files: { type: [FileRefSchema], default: [] } },
    electricityConnection: Boolean,
    waterSource: String,
    accessRoadType: String,
    soilTestReport: FileRefSchema,
    statePurchaseRestrictions: String,
    agriculturalUseCertificate: FileRefSchema,
  },
  { timestamps: true }
);

AgriculturalSchema.index(TEXT_INDEX_FIELDS, { name: 'Agri_Text' });
AgriculturalSchema.index({ city: 1, numberOfBorewells: 1 }, { name: 'Agri_Borewells' });

AgriculturalSchema.pre<IBaseListing>('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  next();
});

export const Agricultural: Model<IAgricultural> =
  (mongoose.models && (mongoose.models as any)['Agricultural']) || mongoose.model<IAgricultural>('Agricultural', AgriculturalSchema);

export default Agricultural;
