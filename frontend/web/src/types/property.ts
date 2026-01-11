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
  address: string;
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
  createdAt?: string;
  floorNumber?:number | string;
  totalFloors?:number | string;
  type: "Residential" | "Commercial" | "Land" | "Agricultural";
  dimensions?: {
    length?: number;
    width?: number;
  }
  buildingName?: string;
}


export interface ApiResponse {
  __meta?: Meta;
  // your API might return either a single object or an array, so we allow both
  properties?: Property[];      // preferred: when API returns array
  property?: Property | null;   // some endpoints may return a single object
}


export interface RequestOtpPayload  {
  email: string;
};

export interface VerifyOtpPayload {
  email: string;
  otp: string;
};

export interface VerifyOtpResponse {
  message: string;
  token: string;
}

export interface RequestOtpResponse {
  message: string;
}

export interface createRequestOtpPayload {
  name: string;
  email: string;
  role: string;
}

export interface createVerifyOtpPayload {
  email: string;
  otp: string;
  name: string;
  role: string;
}

export interface Leads {
  name: string;
  phone: string;
  email: string;
  projectId: string;
  propertyType: "residentials" | "commercials" | "agriculturals" | "landplots" | "featuredprojects";
  remarks?: string;
}
