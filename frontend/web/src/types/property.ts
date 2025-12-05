// types/property.ts
export interface Meta {
  startedAt?: string;
  defaultsApplied?: {
    propertyType?: string;
  };
}


export interface Property {
  id: string;
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
  parkingType?: "covered" | "open" | string;
  createdAt?: string;
  floorNumber?:number | string;
  totalFloors?:number | string;
  type: "Residential" | "Commercial" | "Land" | "Agricultural";
}


export interface ApiResponse {
  __meta?: Meta;
  // your API might return either a single object or an array, so we allow both
  properties?: Property[];      // preferred: when API returns array
  property?: Property | null;   // some endpoints may return a single object
}
