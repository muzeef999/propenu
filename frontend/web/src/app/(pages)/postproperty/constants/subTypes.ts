import type { ReactNode } from "react";


export type PropertyTypeOption = {
  key: string;
  label: string;
  icon: ReactNode;
};


export const RESIDENTIAL_PROPERTY_OPTIONS: PropertyTypeOption[] = [
  { key: "apartment", label: "Apartment", icon: "🏠" },
  { key: "independent-house", label: "Independent House", icon: "🏠" },
  { key: "villa", label: "Villa", icon: "🏡" },
  { key: "penthouse", label: "Penthouse", icon: "🏙️" },
  { key: "farmhouse", label: "Farmhouse", icon: "🌾" },
];

export const RESIDENTIAL_PROPERTY_KEYS = [
  "apartment",
  "independent-house",
  "duplex",
  "row-house",
  "villa",
  "penthouse",
  "studio",
  "triplex",
  "plot",
  "farmhouse",
] as const;

export type ResidentialPropertyKey =
  (typeof RESIDENTIAL_PROPERTY_KEYS)[number];


export const COMMERCIAL_PROPERTY_OPTIONS: PropertyTypeOption[] = [
  { key: "office", label: "Office", icon: "🏢" },
  { key: "retail", label: "Retail", icon: "🏬" },
  { key: "shop", label: "Shop", icon: "🛒" },
  { key: "showroom", label: "Showroom", icon: "🏪" },
  { key: "warehouse", label: "Warehouse", icon: "🏭" },
  { key: "industrial", label: "Industrial", icon: "🏗️" },
  { key: "coworking", label: "Co-working", icon: "💼" },
  { key: "restaurant", label: "Restaurant", icon: "🍽️" },
  { key: "clinic", label: "Clinic", icon: "🏥" },
];

export const COMMERCIAL_PROPERTY_KEYS = [
  "office",
  "retail",
  "shop",
  "showroom",
  "warehouse",
  "industrial",
  "coworking",
  "restaurant",
  "clinic",
] as const;

export type CommercialPropertyKey =
  (typeof COMMERCIAL_PROPERTY_KEYS)[number];


export const COMMERCIAL_SUBTYPE_MAP = {
  office: ["bare-shell", "warm-shell", "business-center"],
  retail: ["high-street-shop", "mall-shop", "kiosk", "food-court-unit"],
  shop: ["high-street-shop", "shutter-shop", "mall-shop"],
  showroom: ["high-street-shop", "showroom-space"],
  warehouse: ["warehouse-godown", "logistics-hub", "cold-storage"],
  industrial: ["industrial-shed"],
  coworking: ["coworking-dedicated-desk", "coworking-hot-desk"],
  restaurant: ["food-court-unit"],
  clinic: ["clinic-space"],
} as const;

export type CommercialSubType =
  (typeof COMMERCIAL_SUBTYPE_MAP)[keyof typeof COMMERCIAL_SUBTYPE_MAP][number];


export const LAND_PROPERTY_OPTIONS: PropertyTypeOption[] = [
  { key: "residential-plot", label: "Residential Plot", icon: "🏠" },
  { key: "commercial-plot", label: "Commercial Plot", icon: "🏢" },
  { key: "industrial-plot", label: "Industrial Plot", icon: "🏭" },
  { key: "na-plot", label: "NA Plot", icon: "📝" },//other
];

export const LAND_PROPERTY_KEYS = [
  "plot",
  "residential-plot",
  "commercial-plot",
  "industrial-plot",
  "investment-plot",
  "corner-plot",
  "na-plot",
] as const;

export type LandPropertyKey =
  (typeof LAND_PROPERTY_KEYS)[number];
 
// Keep a developer-friendly alias for property types used in basic details
export const LAND_PROPERTY_TYPES = [
  "plot",
  "residential-plot",
  "commercial-plot",
  "industrial-plot",
  "investment-plot",
  "corner-plot",
  "na-plot",
] as const;

// Subtypes / characteristics used in the basic details form for land
export const LAND_PROPERTY_SUBTYPES = [
  "corner",
  "road-facing",
  "two-side-open",
  "three-side-open",
] as const;

export type LandPropertySubtype = (typeof LAND_PROPERTY_SUBTYPES)[number];

export const AGRICULTURAL_PROPERTY_OPTIONS: PropertyTypeOption[] = [
  { key: "farm-land", label: "Farm Land", icon: "🚜" },
  { key: "wet-land", label: "Wet Land", icon: "💧" },
  { key: "dry-land", label: "Dry Land", icon: "☀️" },
  { key: "dairy-farm", label: "Dairy Farm", icon: "🥛" },
];

export const AGRICULTURAL_PROPERTY_KEYS = [
  "agricultural-land",
  "farm-land",
  "orchard-land",
  "plantation",
  "wet-land",
  "dry-land",
  "ranch",
  "dairy-farm",
] as const;

export type AgriculturalPropertyKey =
  (typeof AGRICULTURAL_PROPERTY_KEYS)[number];


  export const AGRICULTURAL_PROPERTY_SUBTYPES = [
  "irrigated",
  "non-irrigated",
  "fenced",
  "unfenced",
  "with-well",
  "with-borewell",
  "with-electricity",
  "near-road",
  "inside-village",
  "farmhouse-permission",
] as const;

export type AgriculturalPropertySubType =
  (typeof AGRICULTURAL_PROPERTY_SUBTYPES)[number];

  
