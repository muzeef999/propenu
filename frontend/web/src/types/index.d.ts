export interface FeaturedProject {
  // basic
  _id: string;
  title: string;
  slug: string;
  logo: {
    url: string;
  };
  // relations
  developer?: Types.ObjectId | string;

  // hero section
  heroImage?: string;
  heroVideo?: string;
  heroTagline?: string;
  heroSubTagline?: string;
  heroDescription?: string;

  // SEO / branding
  color?: string; // hex e.g. '#000'
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;

  // address & geo
  address: string;
  city?: string;
  location?: {
    type: "Point";
    // [lng, lat]
    coordinates: [number, number] | number[];
  };
  mapEmbedUrl?: string;

  // pricing / bhk
  currency?: string; // default: 'INR'
  priceFrom?: number; // computed
  priceTo?: number; // computed
  bhkSummary: IBhkSummary[];
  sqftRange?: { min?: number; max?: number };

  // timeline & counts
  possessionDate?: string;
  totalTowers?: number;
  totalFloors?: string;
  projectArea?: number;
  totalUnits?: number;
  availableUnits?: number;

  aboutSummary?: AboutItem[];

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
  status?: "active" | "inactive" | "archived";
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  relatedProjects?: Array<Types.ObjectId | string>;
}

export interface AgentConnect {
  name: string;
  slug: string;
  bio: string;
  agencyName: string;
  licenseValidTill: string;
  areasServed: string[];
  city: string;
  experienceYears: number;
  dealsClosed: number;
  languages: string[];
  verificationStatus: string;
  verificationDocuments: any[];
  avatar: Avatar;
  coverImage: CoverImage;
  rera: ReraInfo;
  stats: Stats;
  _id: string;
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
  url?: string; // S3 url, optional (server may not provide)
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

  listingType: string; // Rent / buy etc.
  category: string; // Residential, Commercial, etc.
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

export interface Locality {
  name: string;
}

export interface LocationItem {
  _id: string;
  city: string;
  state: string;
  category: string;
  localities: Locality[];
}

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

export type categoryOption =
  | "Residential"
  | "Commercial"
  | "Land"
  | "Agricultural";

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

type RESFilterKey =
  | "Property Type"
  | "Sales Type"
  | "Possession Status"
  | "Covered Area"
  | "Bathroom"
  | "Balcony"
  | "Parking"
  | "Furnishing"
  | "Amenities"
  | "Facing"
  | "Verified Properties"
  | "Posted Since"
  | "Posted By";

export type CommercialFilterKey =
  | "Commercial Type"
  | "Commercial Sub Type"
  | "Transaction Type"
  | "Construction Status"
  | "Built-up Area"
  | "Carpet Area"
  | "Floor Number"
  | "Total Floors"
  | "Furnishing Status"
  | "Pantry"
  | "Power Capacity"
  | "Parking"
  | "Fire Safety"
  | "Flooring Type"
  | "Wall Finish"
  | "Tenant Available"
  | "Banks Approved"
  | "Verified Properties" 
  | "Price Negotiable"
  | "Posted Since"
  | "Posted By";

export type LandFilterKey =
  | "Land Type"
  | "Land Sub Type"
  | "Plot Area"
  | "Dimensions"
  | "Road Width"
  | "Facing"
  | "Corner Plot"
  | "Ready To Construct"
  | "Water Connection"
  | "Electricity Connection"
  | "Approved By"
  | "Land Use Zone"
  | "Banks Approved"
  | "Price Negotiable"
  | "Verified Properties"
  | "Posted Since"
  | "Posted By";

export type AgriculturalFilterKey =
  | "Agricultural Type"
  | "Agricultural Sub Type"
  | "Total Area"
  | "Area Unit"
  | "Soil Type"
  | "Irrigation Type"
  | "Number of Borewells"
  | "Water Source"
  | "Electricity Connection"
  | "Current Crop"
  | "Plantation Age"
  | "Road Width"
  | "Access Road Type"
  | "Boundary Wall"
  | "State Restrictions"
  | "Price Negotiable"
  | "Verified Properties"
  | "Posted Since"
  | "Posted By";

export type SelectionType = "single" | "multiple";

type SelectableButtonProps = {
  selectionType?: SelectionType;
};

export interface MoreFilterSection {
  key: RESFilterKey;
  label: string;
  filterKey?: keyof ResidentialFilters;
  options?: string[];
  selectionType?: SelectionType;
}

export interface MoreFilterSectionCom {
  key: CommercialFilterKey;
  label: string;
  options?: string[];
  filterKey?: keyof CommercialFilters;
  selectionType?: SelectionType;
}

export interface MoreFilterSectionLand {
  key: LandFilterKey;
  label: string;
  options?: string[];
  filterKey?: keyof LandFilters;
  selectionType?: SelectionType;
}

export interface MoreFilterSectionAGR {
  key: AgriculturalFilterKey;
  label: string;
  options?: string[];
  filterKey?: keyof AgriculturalFilters;
  selectionType?: SelectionType;
}



type Plan = {
  _id: string;
  name: string;
  tier: "free" | "tier1" | "tier2" | "tier3";
  price: number;
  features: Record<string, any>;
};
