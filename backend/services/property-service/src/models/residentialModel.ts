// src/models/property/residential.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { FLOORING_TYPES, IResidential, KITCHEN_TYPES, PROPERTY_AGE_BUCKETS, RESIDENTIAL_PROPERTY_TYPES } from '../types/residentialTypes';
import { BaseFields, FileRefSchema } from './sharedSchemas';
import { IBaseListing, TEXT_INDEX_FIELDS } from '../types/sharedTypes';


/* Schema */
const ResidentialSchema = new Schema<IResidential>(
  {
    ...BaseFields,
    bhk: Number,
    bedrooms: Number,
    buildingName:String, 
    bathrooms: Number,
    balconies: Number,
    carpetArea: Number,
    builtUpArea: Number,
    transactionType: {
      type: String,
      enum: ["new-sale", "resale"],
    },
    flooringType: { type: String, enum: FLOORING_TYPES },
    kitchenType: { type: String, enum: KITCHEN_TYPES },
    propertyAge: { type: String, enum: PROPERTY_AGE_BUCKETS },
    constructionYear: Number,
    isModularKitchen: { type: Boolean, default: false },
    furnishing: { type: String, enum: ['unfurnished', 'semi-furnished', 'fully-furnished'] },
    parkingType: String,
    floorNumber: Number,
    totalFloors: Number,
    facing: String,
    constructionStatus: { type: String, enum: ['ready-to-move', 'under-construction'] },
    possessionDate: Date,
    security: { gated: Boolean, cctv: Boolean, guard: Boolean, details: String },
    fireSafetyDetails: { hasFireSafety: Boolean, fireNOCFile: FileRefSchema, details: String },
    greenCertification: { leed: Boolean, igbc: Boolean, details: String, file: FileRefSchema },
    smartHomeFeatures: { type: [String], default: [] },
    parkingDetails: { visitorParking: Boolean, twoWheeler: Number, fourWheeler: Number },
    possessionVerified: { type: Boolean, default: false },
    propertyType: { type: String, enum: RESIDENTIAL_PROPERTY_TYPES},
  },
  { timestamps: true }
);

/* Indexes */
ResidentialSchema.index(TEXT_INDEX_FIELDS, { name: 'Res_Text' });

/* Hooks */
ResidentialSchema.pre<IBaseListing>('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  next();
});


ResidentialSchema.pre<IBaseListing>('validate', async function (next) {
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

export const Residential: Model<IResidential> =
  (mongoose.models && (mongoose.models as any)['Residential']) || mongoose.model<IResidential>('Residential', ResidentialSchema);

export default Residential;
