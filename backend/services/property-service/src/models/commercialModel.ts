// src/models/property/commercial.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  BaseFields,
  FileRefSchema,
} from './sharedSchemas';
import { COMMERCIAL_PROPERTY_SUBTYPES, COMMERCIAL_PROPERTY_TYPES, ICommercial, PANTRY_TYPES } from '../types/commercialTypes';
import { IBaseListing, TEXT_INDEX_FIELDS } from '../types/sharedTypes';


const PantrySchema = new Schema(
  {
    type: {
      type: String,
      enum: PANTRY_TYPES, 
    },
    insidePremises: { type: Boolean }, 
    shared: { type: Boolean },         
  },
  { _id: false }
);


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
    constructionStatus: { type: String, enum: ['ready-to-move', 'under-construction', 'new-lanch'] },
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

    propertyType: {
      type: String,
      enum: COMMERCIAL_PROPERTY_TYPES,
    },
    propertySubType: {
      type: String,
      enum: COMMERCIAL_PROPERTY_SUBTYPES,
    },

    superBuiltUpArea: Number,
    carpetArea: Number,
    officeRooms: Number,
    cabins: Number,
    meetingRooms: Number,
    conferenceRooms: Number,
    seats: Number,
    transactionType: {
      type: String,
      enum: ["new-sale", "resale", "pre-leased", "rent", "lease"],
    },
    pantry: PantrySchema,
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

CommercialSchema.pre<IBaseListing>('validate', async function (next) {
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


export const Commercial: Model<ICommercial> =
  (mongoose.models && (mongoose.models as any)['Commercial']) || mongoose.model<ICommercial>('Commercial', CommercialSchema);

export default Commercial;
