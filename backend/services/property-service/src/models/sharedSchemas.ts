// src/models/property/sharedSchemas.ts
import mongoose, { Schema, Types } from 'mongoose';
import { IFileRef, IImage, TEXT_INDEX_FIELDS } from '../types/sharedTypes';
import "./userModel"

export const FileRefSchema = new Schema<IFileRef>(
  {
    title: String,
    url: String,
    key: String,
    filename: String,
    mimetype: String,
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

export const ImageSchema = new Schema<IImage>(
  {
    url: { type: String, required: true },
    key: String,
    filename: String,
    mimetype: String,
    order: { type: Number, default: 0 },
    caption: String,
  },
  { _id: false }
);

/* -------------------------
   BASIC LIST SUB-SCHEMAS
   ------------------------- */
export interface IAmenity { key?: string; title?: string; description?: string; }
export const AmenitySchema = new Schema<IAmenity>({ key: String, title: String, description: String }, { _id: false });

export interface ISpecItem { title?: string; description?: string; }
export const SpecItemSchema = new Schema<ISpecItem>({ title: String, description: String }, { _id: false });

export interface ISpecification { category?: string; items?: ISpecItem[]; order?: number; }
export const SpecificationSchema = new Schema<ISpecification>({ category: String, items: { type: [SpecItemSchema], default: [] }, order: { type: Number, default: 0 } }, { _id: false });

export interface INearbyPlace { name?: string; type?: string; distanceText?: string; coordinates?: [number, number]; order?: number; }
export const NearbyPlaceSchema = new Schema<INearbyPlace>(
  {
    name: String,
    type: String,
    distanceText: String,
    coordinates: {
      type: [Number],
      validate: { validator: (v: number[]) => !v || v.length === 2, message: 'coordinates must be [lng, lat]' },
    },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/* -------------------------
   UNIT / BHK SUB-SCHEMAS
   ------------------------- */
export interface IUnit {
  minSqft?: number;
  maxSqft?: number;
  minPrice?: number;
  maxPrice?: number;
  availableCount?: number;
  plan?: IFileRef;
}
export const UnitSchema = new Schema<IUnit>({ minSqft: Number, maxSqft: Number, minPrice: Number, maxPrice: Number, availableCount: { type: Number, default: 0 }, plan: { type: FileRefSchema } }, { _id: false });

export interface IBhkSummary {
  bhk: number;
  bhkLabel?: string;
  minPrice?: number;
  maxPrice?: number;
  units?: IUnit[];
}
export const BhkSummarySchema = new Schema<IBhkSummary>({ bhk: { type: Number, required: true }, bhkLabel: String, minPrice: Number, maxPrice: Number, units: { type: [UnitSchema], default: [] } }, { _id: false });

/* -------------------------
   LEGAL / BUYER-CHECK SCHEMA
   ------------------------- */
export interface ILegalChecks {
  titleDeed?: IFileRef | null;
  saleDeed?: IFileRef | null;
  encumbranceCertificate?: IFileRef | null;
  occupancyCertificate?: IFileRef | null;
  commencementCertificate?: IFileRef | null;
  conversionCertificate?: IFileRef | null;
  reraRegistrationNumber?: string | null;
  approvals?: string[]; // e.g., ['DTCP','HMDA','BDA','RERA']
  approvalsFiles?: IFileRef[];
  taxReceipts?: IFileRef[];
  litigation?: { hasLitigation?: boolean; details?: string; documents?: IFileRef[] };
  verifiedBy?: { verifierId?: Types.ObjectId; verifiedAt?: Date; notes?: string };
}
export const LegalChecksSchema = new Schema<ILegalChecks>(
  {
    titleDeed: { type: FileRefSchema },
    saleDeed: { type: FileRefSchema },
    encumbranceCertificate: { type: FileRefSchema },
    occupancyCertificate: { type: FileRefSchema },
    commencementCertificate: { type: FileRefSchema },
    conversionCertificate: { type: FileRefSchema },
    reraRegistrationNumber: String,
    approvals: { type: [String], default: [] },
    approvalsFiles: { type: [FileRefSchema], default: [] },
    taxReceipts: { type: [FileRefSchema], default: [] },
    litigation: {
      hasLitigation: { type: Boolean, default: false },
      details: String,
      documents: { type: [FileRefSchema], default: [] },
    },
    verifiedBy: {
      verifierId: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: Date,
      notes: String,
    },
  },
  { _id: false }
);

/* -------------------------
   BASE FIELDS (reused in each model)
------------------------- */
export const BaseFields = {
  
  slug: { type: String, required: true, unique: true, trim: true },
  listingType: { type: String, enum: ['sale', 'rent', 'lease'], default: 'sale', index: true, required: true },
  listingSource: {  type: String, required: true, trim: true},
  address: { type: String, required: true },
  description : {type: String, required: true},
  locality :{type: String, required:true},
  city: { type: String, index: true },
  state: String,
  pincode: String,
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], index: '2dsphere' } },
  mapEmbedUrl: String,
  currency: { type: String, default: 'INR' },
  price: { type: Number, index: true },
  pricePerSqft: { type: Number, index: true },
  gallery: { type: [ImageSchema], default: [] },
  documents: { type: [FileRefSchema], default: [] },
  specifications: { type: [SpecificationSchema], default: [] },
  amenities: { type: [AmenitySchema], default: [] },
  nearbyPlaces: { type: [NearbyPlaceSchema], default: [] },
  legalChecks: { type: LegalChecksSchema },
  rank: { type: Number, default: 1, index: true },
  banksApproved: {  type: [String],default: [],},
  isPriceNegotiable:{ type: Boolean, default: false, index: true },
  meta: {
    views: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true, require, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  relatedProjects: { type: [Schema.Types.ObjectId], ref: 'featuredProject', default: [] },
} as const;


export default {
  FileRefSchema,
  ImageSchema,
  AmenitySchema,
  SpecificationSchema,
  NearbyPlaceSchema,
  BhkSummarySchema,
  UnitSchema,
  LegalChecksSchema,
  BaseFields,
  TEXT_INDEX_FIELDS,
};
