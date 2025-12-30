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
  name: string;
  email: string;
};

export interface VerifyOtpPayload {
  name: string;
  email: string;
  otp: string;
};

export interface VerifyOtpResponse {
  message: string;
  token: string;
}
