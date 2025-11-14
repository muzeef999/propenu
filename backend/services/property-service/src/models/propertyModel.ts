import mongoose, { Schema, Types, Model, models, Document } from "mongoose";
import {
  Address,
  Amenities,
  Created,
  Image,
  ListingType,
  PropertyBase,
  PropertyCategory,
  PropertyCategoryT,
  Video,
} from "../types";

/* --------------------------- Sub-Schemas --------------------------- */
const imageSchema = new Schema<Image>(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
    alt: String,
    size: Number,
  },
  { _id: false }
);

const videoSchema = new Schema<Video>(
  {
    key: { type: String, required: true },
    url: { type: String, required: true },
    alt: String,
    size: Number,
  },
  { _id: false }
);

const AddressSchema = new Schema<Address>(
  {
    addressLine: { type: String },
    nearbyLandmarks: [{ type: String }],
    city: { type: String, index: true },
    pincode: { type: String },
  },
  { _id: false }
);

const AmenitiesSchema = new Schema<Amenities>(
  {
    waterSupply: Boolean,
    powerBackup: Boolean,
    parking: Boolean,
    security: Boolean,
    gym: Boolean,
    swimmingPool: Boolean,
    clubhouse: Boolean,
    lift: Boolean,
  },
  { _id: false }
);

const creadedSchema =  new Schema<Created>(
  {
             
  },
  {_id : false}
)

/* --------------------------- Interface Fix --------------------------- */
// ✅ This interface merges PropertyBase + Mongoose Document
export interface PropertyDocument extends PropertyBase, Document {
  _id: Types.ObjectId; // all Mongo docs have this
  images: Image[];
  videos: Video[];
}

/* --------------------------- Main Schema --------------------------- */
const PropertySchema = new Schema<PropertyDocument>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String },
    listingType: {
      type: String,
      enum: ListingType,
      index: true,
      required: true,
    },
    category: {
      type: String,
      enum: PropertyCategory,
      index: true,
      required: true,
    },
    price: { type: Number, index: true },
    facing: { type: String },
    area: { type: Number },
    isVerified: { type: Boolean, default: false, index: true },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    status:{type: String, enum:["draft", "published", "archived"] },
    verifiedBy: { type: Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    address: AddressSchema,
    amenities: AmenitiesSchema,
    images: { type: [imageSchema], default: [] },
    videos: { type: [videoSchema], default: [] },
    listedDate: { type: Date, default: () => new Date(), index: true },
    details: { type: Schema.Types.Mixed },


  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdByRole: { type: String, enum: ['builder','agent','seller','admin'] },
  builder: { type: Schema.Types.ObjectId, ref: 'Builder', default: null },
  agent: { type: Schema.Types.ObjectId, ref: 'Agent', default: null },
  seller: { type: Schema.Types.ObjectId, ref: 'User', default: null },

  },
  { timestamps: true }
);

/* --------------------------- Model Export --------------------------- */
// ✅ Now TypeScript knows propertyModel returns PropertyDocument
export const propertyModel: Model<PropertyDocument> =
  (models.Property as Model<PropertyDocument>) ||
  mongoose.model<PropertyDocument>("Property", PropertySchema);

/* --------------------------- Utilities --------------------------- */
export function validateDetailsByCategory(
  category: PropertyCategoryT,
  details: Record<string, any>
) {
  if (!details) return { valid: true };
  switch (category) {
    case "Residential":
      if (typeof details.bhk === "number" || typeof details.bathrooms === "number")
        return { valid: true };
      return { valid: false, message: "Residential details should include bhk or bathrooms" };
    case "Commercial":
      if (details.propertyType || typeof details.floor === "number")
        return { valid: true };
      return { valid: false, message: "Commercial details should include propertyType or floor" };
    case "LandPlot":
      return { valid: true };
    case "Agricultural":
      return { valid: true };
    default:
      return { valid: true };
  }
}

export async function ensurePropertyIndexes() {
  await propertyModel.collection.createIndex({
    "address.city": 1,
    category: 1,
    listingType: 1,
  });
  await propertyModel.collection.createIndex({ price: 1 });
  await propertyModel.collection.createIndex({ listedDate: -1 });
  await propertyModel.collection.createIndex({ isVerified: 1 });
}
