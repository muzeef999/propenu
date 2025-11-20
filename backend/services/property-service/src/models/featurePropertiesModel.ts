import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * TypeScript interfaces (data shapes)
 * Keep these in sync with your service layer.
 */
export interface IBhkSummary {
  bhk: number;
  bhkLabel?: string;
  minSqft?: number;
  maxSqft?: number;
  minPrice?: number;
  maxPrice?: number;
  availableCount?: number;
}

export interface IGalleryItem {
  title?: string;
  url: string;
  category?: string;
  order?: number;
}

export interface IAmenity {
  key?: string;
  title?: string;
  description?: string;
  icon?: string;
}

export interface ISpecItem {
  title?: string;
  description?: string;
}

export interface ISpecification {
  category?: string;
  items?: ISpecItem[];
  order?: number;
}

export interface INearbyPlace {
  name?: string;
  type?: string;
  distanceText?: string;
  coordinates?: [number, number] | number[]; // [lng, lat]
  order?: number;
}

export interface ILead {
  name: string;
  phone: string;
  location?: string;
  message?: string;
  createdAt?: Date;
}

/**
 * Core Featured Project shape (POJO)
 */
export interface IFeaturedProject {
  title: string;
  slug: string;

  developer?: Types.ObjectId | string;

  // hero
  heroImage?: string;
  heroVideo?: string;
  heroTagline?: string;
  heroSubTagline?: string;
  heroDescription?: string;

  // SEO / branding
  color?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;

  // address & geo
  address: string;
  city?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number] | number[];
  };
  mapEmbedUrl?: string;

  // pricing / bhk
  currency?: string;
  priceFrom?: number;
  priceTo?: number;
  bhkSummary: IBhkSummary[];
  sqftRange?: { min?: number; max?: number };

  // timeline & counts
  possessionDate?: string;
  totalTowers?: number;
  totalFloors?: string;
  projectArea?: number;
  totalUnits?: number;
  availableUnits?: number;

  // legal / banks
  reraNumber?: string;
  banksApproved?: string[];

  // media & gallery
  gallerySummary: IGalleryItem[];
  brochureUrl?: string;
  brochureFileName?: string;

  // specifications & amenities
  specifications: ISpecification[];
  amenities: IAmenity[];

  // nearby places
  nearbyPlaces: INearbyPlace[];

  // leads (embedded small-volume) - optional
  leads?: ILead[];

  // flags & meta
  isFeatured?: boolean;
  rank?: number;
  meta?: {
    views?: number;
    inquiries?: number;
    clicks?: number;
  };

  // status & audit
  status?: 'active' | 'inactive' | 'archived';
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  relatedProjects?: Array<Types.ObjectId | string>;
}

/**
 * Mongoose document type (extends both POJO and Document)
 */
export interface IFeaturedProjectDocument extends IFeaturedProject, Document {}

/**
 * If you want a separate Lead collection later:
 */
export interface ILeadDocument extends ILead, Document {
  projectId: Types.ObjectId;
}

/* -------------------------
   Sub-schemas (Mongoose)
   -------------------------*/

// BHK summary
const BhkSummarySchema = new Schema<IBhkSummary>(
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

// Gallery item
const GallerySummarySchema = new Schema<IGalleryItem>(
  {
    title: { type: String },
    url: { type: String, required: true },
    category: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// Amenity
const AmenitySchema = new Schema<IAmenity>(
  {
    key: { type: String },
    title: { type: String },
    description: { type: String },
    icon: { type: String },
  },
  { _id: false }
);

// Specification item & category
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

// Nearby place
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

// Lead (embedded)
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
    city: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' },
    },
    mapEmbedUrl: { type: String },

    // pricing / bhk
    currency: { type: String, default: 'INR' },
    priceFrom: { type: Number },
    priceTo: { type: Number },
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
    isFeatured: { type: Boolean, default: false },
    rank: { type: Number, default: 1 },

    meta: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
    },

    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },

    // audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    relatedProjects: { type: [Schema.Types.ObjectId], ref: 'featuredProject', default: [] },
  },
  { timestamps: true }
);

FeaturePropertySchema.index({ title: 'text', address: 'text', city: 'text' });

FeaturePropertySchema.pre<IFeaturedProjectDocument>('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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

// Optional: separate Lead model (if you want to scale leads out later)
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
