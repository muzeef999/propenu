// src/models/ownerPropertyModel.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import {
  IOwnerProperty,
  IOwnerDetails,
  IOwnerPropertiesExtra,
  IMediaItem,
  ILocation,
  ILegalCertification,
} from "../types/popularOwnerTypes";

/* ----------------------------------------
   Media Item Schema
----------------------------------------- */
const MediaItemSchema = new Schema<IMediaItem>(
  {
    type: { type: String, enum: ["image", "video", "virtual", "plan"], required: true, index: true },
    title: String,
    url: { type: String, required: true },
    key: String,
    filename: String,
    mimetype: String,
    order: Number,
  },
  { _id: false }
);

/* ----------------------------------------
   Legal Certification
----------------------------------------- */
const LegalSchema = new Schema<ILegalCertification>(
  {
    name: { type: String, required: true },
    link: String,
    issuedBy: String,
    issuedDate: Date,
  },
  { _id: false }
);

/* ----------------------------------------
   Location Schema
----------------------------------------- */
const LocationSchema = new Schema<ILocation>(
  {
    address: String,
    city: { type: String, index: true },
    state: { type: String, index: true },
    pincode: { type: String, index: true },
    landmark: String,
    mapCoordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // lng, lat
    },
  },
  { _id: false }
);

/* ----------------------------------------
   Owner Extra Properties
----------------------------------------- */
const OwnerExtraSchema = new Schema<IOwnerPropertiesExtra>(
  {
    userRef: { type: Schema.Types.ObjectId, ref: "User", index: true },
    ownerName: String,
    ownerContact: String,
    ownerEmail: String,
    ownerType: String,
    agencyName: String,
    isVerified: { type: Boolean, default: false },
    documents: [{ name: String, url: String }],
  },
  { _id: false }
);

/* ----------------------------------------
   Main Schema
----------------------------------------- */

export interface IOwnerPropertyDoc extends Document, Omit<IOwnerProperty, "_id"> {}

const OwnerPropertySchema = new Schema<IOwnerPropertyDoc>(
  {
    title: { type: String, required: true, text: true },
    description: String,

    category: { type: String, required: true, index: true },
    subcategory: { type: String, required: true, index: true },

    propertyType: String,
    status: String,
    availabilityStatus: { type: String, index: true },

    price: { type: Number, index: true },
    priceFrom: Number,
    priceTo: Number,

    carpetArea: Number,
    builtUpArea: Number,
    totalFloors: Number,
    floorNumber: Number,

    bedrooms: { type: Number, index: true },
    bathrooms: Number,
    balconies: Number,
    furnishing: String,

    ownerDetails: {
      ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
      ownerName: String,
      ownerContact: String,
    },

    ownerProperties: { type: OwnerExtraSchema, default: {} },

    location: LocationSchema,

    media: { type: [MediaItemSchema], default: [] },

    interiorDetails: Schema.Types.Mixed,
    nearby: Schema.Types.Mixed,

    amenities: [{ type: String }],

    legalCertification: [LegalSchema],

    slug: { type: String, unique: true, sparse: true, index: true },

    meta: {
      views: { type: Number, default: 0 },
      createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    },
  },
  { timestamps: true }
);

/* ----------------------------------------
   Index Optimizations
----------------------------------------- */

// text search
OwnerPropertySchema.index(
  { title: "text", description: "text", "location.address": "text" },
  { weights: { title: 10, description: 2, "location.address": 4 } }
);

// Geo search
OwnerPropertySchema.index({ "location.mapCoordinates": "2dsphere" });

// Fast filtering
OwnerPropertySchema.index({ category: 1, subcategory: 1, price: 1 });
OwnerPropertySchema.index({ availabilityStatus: 1, price: 1 });
OwnerPropertySchema.index({ bedrooms: 1, price: 1 });
OwnerPropertySchema.index({ amenities: 1 });

/* ----------------------------------------
   Model Export
----------------------------------------- */
const OwnerPropertyModel: Model<IOwnerPropertyDoc> = mongoose.model<IOwnerPropertyDoc>(
  "OwnerProperty",
  OwnerPropertySchema
);

export default OwnerPropertyModel;
