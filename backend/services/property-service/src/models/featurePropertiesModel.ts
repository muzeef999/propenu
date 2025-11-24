// src/models/featurePropertiesModel.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  IAmenity,
  IBhkSummary,
  IFeaturedProject,
  IGalleryItem,
  ILead,
  INearbyPlace,
  ISpecification,
  ISpecItem,
} from '../types/featurePropertiesTypes';

export interface IFeaturedProjectDocument extends IFeaturedProject, Document {}
export interface ILeadDocument extends ILead, Document {
  projectId: Types.ObjectId;
}

/* ------------------------
   Sub-schemas
   ------------------------ */
const BhkSummarySchema = new Schema<IBhkSummary>(
  {
    bhk: { type: Number, required: true },
    bhkLabel: { type: String },
    plan: {
      url: { type: String },
      key: { type: String },
      filename: { type: String },
      mimetype: { type: String },
    },
    minSqft: { type: Number },
    maxSqft: { type: Number },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    availableCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const GallerySummarySchema = new Schema<IGalleryItem>(
  {
    title: { type: String },
    url: { type: String, required: true },
    category: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const AmenitySchema = new Schema<IAmenity>(
  {
    key: { type: String },
    title: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const SpecificationItemSchema = new Schema<ISpecItem>(
  {
    title: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const SpecificationSchema = new Schema<ISpecification>(
  {
    category: { type: String },
    items: { type: [SpecificationItemSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const NearbyPlaceSchema = new Schema<INearbyPlace>(
  {
    name: { type: String },
    type: { type: String },
    distanceText: { type: String },
    coordinates: {
      type: [Number],
      validate: {
        validator: (v: number[]) => !v || v.length === 2,
        message: 'coordinates must be [lng, lat]',
      },
    },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    message: { type: String, trim: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

/* -------------------------
   Main schema
   -------------------------*/
const FeaturePropertySchema = new Schema<IFeaturedProjectDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },

    developer: { type: Schema.Types.ObjectId, ref: 'builders' },

    // hero
    heroImage: { type: String },
    heroVideo: { type: String },
    heroTagline: { type: String },
    heroSubTagline: { type: String },
    heroDescription: { type: String },

    // SEO / branding
    color: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: { type: String },

    // address & geo
    address: { type: String, required: true },
    city: { type: String, index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' },
    },
    mapEmbedUrl: { type: String },

    // pricing / bhk
    currency: { type: String, default: 'INR' },
    priceFrom: { type: Number, index: true },
    priceTo: { type: Number, index: true },
    bhkSummary: { type: [BhkSummarySchema], default: [] },

    sqftRange: {
      min: { type: Number },
      max: { type: Number },
    },

    // timeline & counts
    possessionDate: { type: String },
    totalTowers: { type: Number },
    totalFloors: { type: String },
    projectArea: { type: Number },
    totalUnits: { type: Number },
    availableUnits: { type: Number },

    // legal / banks
    reraNumber: { type: String },
    banksApproved: { type: [String], default: [] },

    // media & gallery
    gallerySummary: { type: [GallerySummarySchema], default: [] },
    brochureUrl: { type: String },
    brochureFileName: { type: String },

    // specifications & amenities
    specifications: { type: [SpecificationSchema], default: [] },
    amenities: { type: [AmenitySchema], default: [] },

    // nearby places
    nearbyPlaces: { type: [NearbyPlaceSchema], default: [] },

    // embedded leads (small volume)
    leads: { type: [LeadSchema], default: [] },

    // flags & meta
    isFeatured: { type: Boolean, default: false, index: true },
    rank: { type: Number, default: 1, index: true },

    meta: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
    },

    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },

    // audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    relatedProjects: { type: [Schema.Types.ObjectId], ref: 'featuredProject', default: [] },
  },
  { timestamps: true }
);

/* -------------------------
   Indexes (recommended)
   ------------------------- */

// text index for search across title/address/city
FeaturePropertySchema.index({ title: 'text', address: 'text', city: 'text' }, { name: 'Idx_Text_Search' });

// single-field index for boolean featured flag (fast filter)
FeaturePropertySchema.index({ isFeatured: 1 }, { name: 'Idx_IsFeatured' });

// compound index: filter by isFeatured + status, then sort by rank desc and createdAt desc
FeaturePropertySchema.index(
  { isFeatured: 1, status: 1, rank: -1, createdAt: -1 },
  { name: 'Idx_Featured_Status_Rank_CreatedAt' }
);

// compound index: featured by city + rank (use when filtering by city)
FeaturePropertySchema.index({ isFeatured: 1, city: 1, rank: -1 }, { name: 'Idx_Featured_City_Rank' });

// price range index to help range queries (min/max price)
FeaturePropertySchema.index({ priceFrom: 1, priceTo: 1 }, { name: 'Idx_PriceRange' });

// geospatial index (ensure coordinates exist as [lng, lat])
FeaturePropertySchema.index({ 'location.coordinates': '2dsphere' }, { name: 'Idx_Location_2dsphere' });

/* -------------------------
   Hooks
   -------------------------*/
FeaturePropertySchema.pre<IFeaturedProjectDocument>('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

FeaturePropertySchema.pre<IFeaturedProjectDocument>('save', function (next) {
  try {
    if (Array.isArray(this.bhkSummary) && this.bhkSummary.length) {
      const minPrices = this.bhkSummary.map((b) => (b.minPrice ?? Number.POSITIVE_INFINITY));
      const maxPrices = this.bhkSummary.map((b) => (b.maxPrice ?? Number.NEGATIVE_INFINITY));
      const min = Math.min(...minPrices);
      const max = Math.max(...maxPrices);
      // @ts-ignore assign possible undefined
      this.priceFrom = Number.isFinite(min) ? min : undefined;
      // @ts-ignore
      this.priceTo = Number.isFinite(max) ? max : undefined;
    } else {
      // @ts-ignore
      this.priceFrom = undefined;
      // @ts-ignore
      this.priceTo = undefined;
    }
  } catch (e) {
    // if anything goes wrong, don't block save — log and continue
    // eslint-disable-next-line no-console
    console.warn('Error computing priceFrom/priceTo:', e);
  }
  next();
});

const featuredModelName = 'featuredProject';
const FeaturedProject: Model<IFeaturedProjectDocument> =
  (mongoose.models && (mongoose.models as any)[featuredModelName]) ||
  mongoose.model<IFeaturedProjectDocument>(featuredModelName, FeaturePropertySchema);

/* Optional: separate Lead model (if you want to scale leads out later) */
const LeadSchemaFull = new Schema<ILeadDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, required: true, ref: featuredModelName, index: true },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    location: { type: String },
    message: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);
LeadSchemaFull.index({ projectId: 1, createdAt: -1 });

const leadModelName = 'Lead';
const Lead: Model<ILeadDocument> = (mongoose.models && (mongoose.models as any)[leadModelName]) || mongoose.model<ILeadDocument>(leadModelName, LeadSchemaFull);

/* exports */
export { FeaturedProject, Lead };
export default FeaturedProject;
