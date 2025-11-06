import mongoose, { Schema, Document, Model } from "mongoose";

const BhkSummarySchema = new Schema(
  {
    bhk: { type: Number, required: true },
    bhkLabel: { type: String },
    minSqft: { type: Number },
    maxSqft: { type: Number },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    availableCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const GallerySummarySchema = new Schema(
  {
    title: { type: String },
    url: { type: String, required: true },
    category: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const AmenitySchema = new Schema(
  {
    key: { type: String },
    title: { type: String },
    description: { type: String },
    icon: { type: String },
  },
  { _id: false }
);

const SpecificationItemSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const SpecificationSchema = new Schema(
  {
    category: { type: String },
    items: [SpecificationItemSchema],
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const NearbyPlaceSchema = new Schema(
  {
    name: { type: String },
    type: { type: String },
    distanceText: { type: String },
    coordinates: { type: [Number] }, // [lng, lat]
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Main schema
 */
const FeaturePropertySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    // Keep unique on the field OR an explicit index, not both.
    // We keep `unique: true` here and DO NOT call schema.index({ slug: 1, ... }) later.
    slug: { type: String, required: true, unique: true, trim: true },

    developer: { type: Schema.Types.ObjectId, ref: "builders" },
    about: { type: String },
    featuredTagline: { type: String },

    address: { type: String, required: true },
    city: { type: String },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
    mapEmbedUrl: { type: String },

    currency: { type: String, default: "INR" },
    priceFrom: { type: Number },
    priceTo: { type: Number },
    bhkSummary: { type: [BhkSummarySchema], default: [] },

    sqftRange: {
      min: { type: Number },
      max: { type: Number },
    },
    possessionDate: { type: String },

    totalTowers: { type: Number },
    totalFloors: { type: String },
    projectArea: { type: Number },
    totalUnits: { type: Number },
    availableUnits: { type: Number },

    reraNumber: { type: String },
    banksApproved: [{ type: String }],

    heroImage: { type: String },
    heroVideo: { type: String },
    gallery: [{ type: Schema.Types.ObjectId, ref: "GalleryImage" }],
    gallerySummary: { type: [GallerySummarySchema], default: [] },

    brochureUrl: { type: String },
    brochureFileName: { type: String },

    specifications: { type: [SpecificationSchema], default: [] },
    amenities: { type: [AmenitySchema], default: [] },

    nearbyPlaces: { type: [NearbyPlaceSchema], default: [] },

    isFeatured: { type: Boolean, default: true },
    rank: { type: Number, default: 1 },

    meta: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/**
 * Text index for quick search across title/address/city
 * Keep as-is.
 */
FeaturePropertySchema.index({ title: "text", address: "text", city: "text" });

/**
 * NOTE: DO NOT add another index({ slug: 1, unique: true }) here because the field
 * already has `unique: true`. Adding both triggers the Duplicate schema index warning.
 */

/**
 * Auto-generate slug when missing
 */
FeaturePropertySchema.pre("validate", function (next) {
  // use function() to keep `this` typed as any doc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = this;
  if (!doc.slug && doc.title) {
    doc.slug = String(doc.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

/**
 * Guard against model recompilation during hot reload / nodemon / serverless re-imports
 */
export interface IFeaturedProject extends Document {}
const modelName = "featuredProject";
const FeaturedProject: Model<IFeaturedProject> =
  (mongoose.models && (mongoose.models as any)[modelName]) ||
  mongoose.model<IFeaturedProject>(modelName, FeaturePropertySchema);

export default FeaturedProject;
