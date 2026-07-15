// src/models/property/sharedSchemas.ts
import mongoose, { Schema, Types } from "mongoose";
import {
  IFileRef,
  IImage,
  IVerificationDoc,
  TEXT_INDEX_FIELDS,
} from "../types/sharedTypes";
import "./userModel";

export const VerificationDocSchema = new Schema<IVerificationDoc>(
  {
    type: String,
    title: String,
    url: String,
    key: String,
    filename: String,
    mimetype: String,
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { _id: false },
);

export const FileRefSchema = new Schema<IFileRef>(
  {
    title: String,
    url: String,
    key: String,
    filename: String,
    mimetype: String,
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

export const ImageSchema = new Schema<IImage>(
  {
    url: { type: String },
    key: String,
    filename: String,
    mimetype: String,
    order: { type: Number, default: 0 },
    caption: String,
  },
  { _id: false },
);

/* -------------------------
   BASIC LIST SUB-SCHEMAS
   ------------------------- */
export interface IAmenity {
  key?: string;
  title?: string;
  description?: string;
}


export const AmenitySchema = new Schema<IAmenity>(
  { key: String, title: String, description: String },
  { _id: false },
);

export interface ISpecItem {
  title?: string;
  description?: string;
}

export const SpecItemSchema = new Schema<ISpecItem>(
  { title: String, description: String },
  { _id: false },
);

export interface ISpecification {
  category?: string;
  items?: ISpecItem[];
  order?: number;
}

export const SpecificationSchema = new Schema<ISpecification>(
  {
    category: String,
    items: { type: [SpecItemSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

export interface INearbyPlace {
  name?: string;
  type?: string;
  distanceText?: string;
  coordinates?: [number, number];
  order?: number;
}

export const NearbyPlaceSchema = new Schema<INearbyPlace>(
  {
    name: String,
    type: String,
    distanceText: String,
    coordinates: {
      type: [Number],
      validate: {
        validator: (v: number[]) => !v || v.length === 2,
        message: "coordinates must be [lng, lat]",
      },
    },
    order: { type: Number, default: 0 },
  },
  { _id: false },
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

export const UnitSchema = new Schema<IUnit>(
  {
    minSqft: Number,
    maxSqft: Number,
    minPrice: Number,
    maxPrice: Number,
    availableCount: { type: Number, default: 0 },
    plan: { type: FileRefSchema },
  },
  { _id: false },
);

export interface IBhkSummary {
  bhk: number;
  bhkLabel?: string;
  minPrice?: number;
  maxPrice?: number;
  units?: IUnit[];
}

export const BhkSummarySchema = new Schema<IBhkSummary>(
  {
    bhk: { type: Number, required: true },
    bhkLabel: String,
    minPrice: Number,
    maxPrice: Number,
    units: { type: [UnitSchema], default: [] },
  },
  { _id: false },
);

export interface IPromotion {
  type: "normal" | "featured" | "sponsored" | "prime";
  priority: number;
  source: "manual" | "subscription";
  startDate?: Date;
  boostExpiry?: Date;
  enquiryLimit?: number;
  enquiriesUsed?: number;
  features?: {
    emailPromotion?: boolean;
    whatsappPromotion?: boolean;
  };
}


export const PromotionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["normal", "featured", "prime", "sponsored"],
      default: "normal",
      index: true
    },

    priority: {
      type: Number,
      default: 0
    },

    source: {
      type: String,
      enum: ["manual", "subscription"],
      default: "subscription"
    },

    startDate: Date,

    boostExpiry: {
      type: Date,
      index: true
    },

    enquiryLimit: {
      type: Number,
      default: 0
    },

    enquiriesUsed: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

/* -------------------------   BASE FIELDS (reused in each model)------------------------- */
export const BaseFields = {
  title: {
    type: String,
    trim: true,
    index: true,
  },

  slug: {
    type: String,
    required: true,
    trim: true,
  },

  propertyCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true,
  },

  listingType: {
    type: String,
    enum: ["sale", "rent", "lease"],
    default: "sale",
    index: true,
  },
  listingSource: { type: String, trim: true },
  address: {
    type: String,
    required: function (this: any) {
      return this.status === "active";
    },
  },
  description: {
    type: String,
    required: function (this: any) {
      return this.status === "active";
    },
  },
  locality: {
    type: String,
    required: function (this: any) {
      return this.status === "active";
    },
  },
  city: { type: String, index: true },
  state: String,
  pincode: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" },
  },
  mapEmbedUrl: String,
  currency: { type: String, default: "INR" },
  price: { type: Number, min: 0, index: true },
  pricePerSqft: { type: Number, min: 0, index: true },
  gallery: { type: [ImageSchema], default: [] },
  documents: { type: [FileRefSchema], default: [] },
  specifications: { type: [SpecificationSchema], default: [] },
  amenities: { type: [AmenitySchema], default: [] },
  nearbyPlaces: { type: [NearbyPlaceSchema], default: [] },
  rank: { type: Number, default: 1, index: true },
  banksApproved: { type: [String], default: [] },
  isPriceNegotiable: { type: Boolean, default: false, index: true },
  isPublished: { type: Boolean, default: false, index: true },
  meta: {
    views: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  completion: {
    percent: { type: Number, default: 0, min: 0, max: 100 },
    step: { type: Number, default: 1 }, // for stepper UI
    lastSection: { type: String }, // "basic", "location", "gallery", etc.
  },
  verificationDocuments: { type: [VerificationDocSchema], default: [] },
  status: {
    type: String,
    enum: ["draft", "pending", "active", "expired", "deactivated", "archived"],
    default: "draft",
    index: true,
  },
  subscriptionEndDate: Date,
  deactivatedAt: Date,
  deactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approval: {
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvedByManager: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    approvalComment: String,
    approvalToken: String, // ⭐ email approval link token
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: {
    type: Date,
  },
  rejectedReason: {
    type: String,
    default: "",
  },
  postedBy: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: String,
    email: String,
    roleName: String,
    postedAt: {
      type: Date,
      default: Date.now,
    },
  },
  lastUpdatedBy: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: String,
    email: String,
    roleName: String,
    updatedAt: Date,
  },
  updateCount: {
    type: Number,
    default: 0,
  },
  updateHistory: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      name: String,
      email: String,
      roleName: String,
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  relationshipManagerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    default: null,
  },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
} as const;
export default {
  FileRefSchema,
  ImageSchema,
  AmenitySchema,
  SpecificationSchema,
  NearbyPlaceSchema,
  BhkSummarySchema,
  UnitSchema,
  BaseFields,
  TEXT_INDEX_FIELDS,
};
