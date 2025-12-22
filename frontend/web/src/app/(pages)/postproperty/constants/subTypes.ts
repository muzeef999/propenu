// src/constants/residentialSubTypes.ts
import type { ReactNode } from "react";

export type ResidentialSubTypeOption = {
  key: string;
  label: string;
  icon: ReactNode;
};

export const RESIDENTIAL_SUB_TYPES: ResidentialSubTypeOption[] = [
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

export const COMMERCIAL_SUB_TYPES: ResidentialSubTypeOption[] = [
  { key: "office", label: "Office", icon: "🏢" },
  { key: "retail", label: "Retail", icon: "🏬" },
  { key: "warehouse", label: "Warehouse", icon: "🏭" },
  { key: "industrial", label: "Industrial", icon: "🏭" },
  { key: "showroom", label: "Showroom", icon: "🏪" },
  { key: "coworking", label: "Co-Working", icon: "🏢" },
];