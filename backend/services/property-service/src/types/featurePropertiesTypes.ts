import mongoose, { Document, Model, Types } from 'mongoose';

export interface IBhkPlan {
  url?: string;
  key?: string;
  filename?: string;
  mimetype?: string;
}

export interface IBhkSummary {
  bhk: number;

  bhkLabel?: string;
  plan?: IBhkPlan | null;
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


export interface IFeaturedProject {
  // basic
  title: string;
  slug: string;

  // relations
  developer?: Types.ObjectId | string;

  // hero section
  heroImage?: string;
  heroVideo?: string;
  heroTagline?: string;
  heroSubTagline?: string;
  heroDescription?: string;

  // SEO / branding
  color?: string;             // hex e.g. '#000'
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;

  // address & geo
  address: string;
  city?: string;
  location?: {
    type: 'Point';
    // [lng, lat]
    coordinates: [number, number] | number[];
  };
  mapEmbedUrl?: string;

  // pricing / bhk
  currency?: string;  // default: 'INR'
  priceFrom?: number; // computed
  priceTo?: number;   // computed
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

  // leads (embedded) — small volume only; each entry follows ILead
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

