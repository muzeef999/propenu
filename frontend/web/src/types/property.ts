import { IPromotion } from "@/app/(pages)/properties/cards/FeaturedPropertyCard";

// types/property.ts
export interface Meta {
  startedAt?: string;
  defaultsApplied?: {
    category?: string;
  };
}


export interface Property {
  id: string;
  _id: string;
  title: string;
  slug?: string;
  address?: string;
  city?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  gallery?: {
    url: string;
    key: string;
    filename: string;
    order: number;
  }[];
  price?: number;
  pricePerSqft?: number;
  superBuiltUpArea?: number; // sqft
  bedrooms?: number;
  furnishing?: "furnished" | "unfurnished" | "semi-furnished" | string;
  parkingDetails?:{
    visitorParking?: boolean;
    twoWheeler?: number;
    fourWheeler?: number;
  }
  promotion?:IPromotion;
  createdAt?: string;
  floorNumber?:number | string;
  totalFloors?:number | string;
  dimensions?: {
    length?: number;
    width?: number;
  }
  buildingName?: string;
  propertyType?: string;
  listingType?: string;
  transactionType?: string;
  locality?: string;
  priceFrom?: number;
  priceTo?: number;
  bhk?: number | number[];
  bhkSummary?: {
    bhk: number;
    bhkLabel?: string;
    units?: {
      minSqft?: number;
      maxPrice?: number;
      availableCount?: number;
    }[];
  }[];
  builtUpArea?: number | {
    min?: number;
    max?: number;
  };
  gallerySummary?: {
    title?: string;
    url: string;
    category?: string;
    fileName?: string;
    order?: number;
    key?: string;
    mimetype?: string;
  }[];
  amenities?: {
    key?: string;
    title?: string;
    imageUrl?: string;
  }[];
  amenitiesCount?: number;
  type: "Residential" | "Commercial" | "Land" | "Agricultural" | "FeaturedProject";
}


export interface ApiResponse {
  __meta?: Meta;
  // your API might return either a single object or an array, so we allow both
  properties?: Property[];      // preferred: when API returns array
  property?: Property | null;   // some endpoints may return a single object
}


export interface RequestOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  token: string;
  kycStatus?: string;
}

export interface RequestOtpResponse {
  message: string;
}

export interface createRequestOtpPayload {
  phone: string;
}

export interface createVerifyOtpPayload {
  name: string
  email?: string
  role: "user" | "builder" | "agent"
  phone: string
  otp: string
}

export interface Leads {
  name: string;
  phone: string;
  email: string;
  projectId: string;
  propertyType: "residentials" | "commercials" | "agriculturals" | "landplots" | "featuredprojects";
  remarks?: string;
}
