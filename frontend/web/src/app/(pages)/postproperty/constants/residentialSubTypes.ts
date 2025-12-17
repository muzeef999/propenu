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
  { key: "independent-floor", label: "Independent Floor", icon: "🧱" },
  { key: "villa", label: "Villa", icon: "🏡" },
  { key: "penthouse", label: "Penthouse", icon: "🏙️" },
  { key: "studio", label: "Studio", icon: "🎬" },
  { key: "farm-house", label: "Farm House", icon: "🌾" },
];
