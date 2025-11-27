// src/models/property/commercial.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  BaseFields,
  FileRefSchema,
} from './sharedSchemas';
import { ICommercial } from '../types/commercialTypes';
import { TEXT_INDEX_FIELDS } from '../types/sharedTypes';



const CommercialSchema = new Schema<ICommercial>(
  {
    ...BaseFields,
    floorNumber: Number,
    totalFloors: Number,
    furnishedStatus: { type: String, enum: ['unfurnished', 'semi-furnished', 'fully-furnished'] },
    powerBackup: String,
    powerCapacityKw: Number,
    lift: Boolean,
    washrooms: Number,
    ceilingHeightFt: Number,
    builtYear: Number,
    maintenanceCharges: Number,
    fireSafety: Boolean,
    fireNOCFile: FileRefSchema,
    loadingDock: Boolean,
    loadingDockDetails: String,
    parkingCapacity: Number,
    tenantInfo: { type: [{ currentTenant: String, leaseStart: Date, leaseEnd: Date, rent: Number }], default: [] },
    zoning: String,
    occupancyCertificateFile: FileRefSchema,
    leaseDocuments: { type: [FileRefSchema], default: [] },
    buildingManagement: { security: Boolean, managedBy: String, contact: String },
  },
  { timestamps: true }
);

CommercialSchema.index(TEXT_INDEX_FIELDS, { name: 'Com_Text' });

CommercialSchema.pre<ICommercial>('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  next();
});

export const Commercial: Model<ICommercial> =
  (mongoose.models && (mongoose.models as any)['Commercial']) || mongoose.model<ICommercial>('Commercial', CommercialSchema);

export default Commercial;
