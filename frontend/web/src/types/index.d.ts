
export interface FeaturedProject {
  // basic
  _id:string;
  title: string;
  slug: string;
  logo:{
      url:string
  }
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

   aboutSummary?:AboutItem[]
  
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

export interface IBhkPlan {
  url?: string;
  key?: string;
  filename?: string;
  mimetype?: string;
}


export interface IBhkUnit {      
  minSqft?: number;                  
  price?: number;          
  maxPrice?: number;        
  availableCount?: number;  
  plan?: IBhkPlan;          
}

// types/feature.ts
export interface AboutItem {
  aboutDescription?: string;
  rightContent?: string; // newline separated bullets or lines starting with •
  url?: string;          // S3 url, optional (server may not provide)
  key?: string;
  filename?: string;
  mimetype?: string;
}



export interface BhkSummary {
  bhk: number;
  bhkLabel?: string;
  units?: IBhkUnit[];

}



export interface SqftRange {
  min: number;
  max: number;
}

export interface GalleryItem {
  title: string;
  url: string;
  category: string;
  order: number;
}

export interface SpecificationCategory {
  category: string;
  order: number;
  items: SpecificationItem[];
}

export interface SpecificationItem {
  title: string;
  description: string;
}

export interface IAmenity {
  key?: string;
  title?: string;
  description?: string;
}



export interface INearbyPlace {
  name?: string;
  type?: string;
  distanceText?: string;
  coordinates?: [number, number] | number[]; // [lng, lat]
  order?: number;
}


export interface PopularOwnerPropertiesResponse {
  success: boolean;
  message: string;
  count: number;
  properties: PopularOwnerProperty[];
}


export interface PopularOwnerProperty {
  _id: string;
  title: string;
  description: string;
  userId: string;

  listingType: string;          // Rent / Sale etc.
  category: string;             // Residential, Commercial, etc.
  price: number;
  facing?: string | null;
  area?: number;

  isVerified: boolean;
  verificationStatus: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;

  address: {
    addressLine: string;
    nearbyLandmarks: string[];
    city: string;
    pincode: string;
  };

  amenities: {
    waterSupply: boolean;
    powerBackup: boolean;
    parking: boolean;
    security: boolean;
    gym: boolean;
    swimmingPool: boolean;
    clubhouse: boolean;
    lift: boolean;
  };

  images: {
    url: string;
    key: string;
    alt: string;
    size: number;
  }[];

  videos: {
    url?: string;
    title?: string;
  }[];

  details: {
    bhk: number;
    bathrooms: number;
    floor: number;
    propertyType: string;
  };

  listedDate: string;
  createdAt: string;
  updatedAt: string;
}


export type LocationItem = {
  id: number | string;
  name: string;
  lat?: number;
  lon?: number;
  type?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postcode?: string | null;
};



export type PropertyFormValues = {
  title: string;
  description?: string;
  category: "Residential" | "Commercial" | "LandPlot" | "Agricultural";
  listingType: string;
  status?: "draft" | "published" | "archived";

  address: {
    addressLine?: string;
    nearbyLandmarks?: string[];
    city?: string;
    pincode?: string;
  };

  price?: number;
  area?: number;
  facing?: string;
  details?: Record<string, any>;

  amenities: {
    waterSupply?: boolean;
    powerBackup?: boolean;
    parking?: boolean;
    security?: boolean;
    gym?: boolean;
    swimmingPool?: boolean;
    clubhouse?: boolean;
    lift?: boolean;
  };

  images: { url: string; key: string; alt?: string; size?: number }[];
  videos: { url: string; key: string; alt?: string; size?: number }[];

  createdBy?: string;
  createdByRole?: "builder" | "agent" | "seller" | "admin";
  builder?: string | null;
  agent?: string | null;
  seller?: string | null;
};


export type PropertyTypeOption = "Residential" | "Commercial" | "Land" | "Agricultural";

export type ListingOption = "Buy" | "Rent" | "Lease";


export type SearchItem = {
  id?: string;
  type?: string;
  title?: string;
  price?: number;
  currency?: string;
  city?: string;
  location?: any;
  [key: string]: any;
};

export type SearchFilters = {
  filter?: any;
  propertyType?: string;
  sort?: string;
  batchSize?: number;
  page?: number;
  skip?: number;
  options?: any;
};
