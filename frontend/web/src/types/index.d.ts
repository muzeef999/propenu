export interface FeaturedProject {
  _id: string; 
  title: string;
  slug: string;
  developer: string; // likely an ObjectId reference (string)
  about: string;
  featuredTagline: string;
  address: string;
  city: string;

  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };

  mapEmbedUrl: string;
  currency: string;
  priceFrom: number;
  priceTo: number;

  bhkSummary: BHKSummary[];
  sqftRange: SqftRange;

  possessionDate: string;
  totalTowers: number;
  totalFloors: string;
  projectArea: number;
  totalUnits: number;
  availableUnits: number;

  reraNumber: string;
  banksApproved: string[];

  heroImage: string;
  heroVideo?: string;

  gallery: string[]; // likely IDs of gallery assets
  gallerySummary: GalleryItem[];

  brochureUrl: string;
  brochureFileName: string;

  specifications: SpecificationCategory[];
  amenities: Amenity[];
  nearbyPlaces: NearbyPlace[];

  isFeatured: boolean;
  rank: number;

  meta: {
    views: number;
    inquiries: number;
    clicks: number;
  };

  status: 'active' | 'inactive' | 'draft';
  createdBy: string;
  updatedBy: string;
}

export interface BHKSummary {
  bhk: number;
  bhkLabel: string;
  minSqft: number;
  maxSqft: number;
  minPrice: number;
  maxPrice: number;
  availableCount: number;
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

export interface Amenity {
  key: string;
  title: string;
  icon: string;
}

export interface NearbyPlace {
  name: string;
  type: string;
  distanceText: string;
  coordinates: [number, number];
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
