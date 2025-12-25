import type { ReactNode } from "react";

/* ======================================================
   UI OPTION TYPE (used only by UI)
====================================================== */
export type PropertyTypeOption = {
  key: string;
  label: string;
  icon: ReactNode;
};

/* ======================================================
   RESIDENTIAL UI OPTIONS (buttons, icons)
====================================================== */
export const RESIDENTIAL_PROPERTY_OPTIONS: PropertyTypeOption[] = [
  { key: "apartment", label: "Apartment", icon: "🏠" },
  { key: "independent-house", label: "Independent House", icon: "🏠" },
  { key: "duplex", label: "Duplex", icon: "🏘️" },
  { key: "row-house", label: "Row House", icon: "🧱" },
  { key: "villa", label: "Villa", icon: "🏡" },
  { key: "penthouse", label: "Penthouse", icon: "🏙️" },
  { key: "studio", label: "Studio", icon: "🎬" },
  { key: "triplex", label: "Triplex", icon: "🏚️" },
  { key: "plot", label: "Plot", icon: "📐" },
  { key: "farmhouse", label: "Farmhouse", icon: "🌾" },
];

/* ======================================================
   COMMERCIAL UI OPTIONS
====================================================== */
export const COMMERCIAL_PROPERTY_OPTIONS: PropertyTypeOption[] = [
  { key: "office", label: "Office", icon: "🏢" },
  { key: "retail", label: "Retail", icon: "🏬" },
  { key: "warehouse", label: "Warehouse", icon: "🏭" },
  { key: "industrial", label: "Industrial", icon: "🏭" },
  { key: "showroom", label: "Showroom", icon: "🏪" },
  { key: "coworking", label: "Co-Working", icon: "🏢" },
];

/* ======================================================
   🔐 VALIDATION-SAFE STRING ARRAYS (Zod + backend)
====================================================== */
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

export const COMMERCIAL_PROPERTY_KEYS = [
  "office",
  "retail",
  "warehouse",
  "industrial",
  "showroom",
  "coworking",
] as const;

export type ResidentialPropertyKey =
  (typeof RESIDENTIAL_PROPERTY_KEYS)[number];

export type CommercialPropertyKey =
  (typeof COMMERCIAL_PROPERTY_KEYS)[number];
