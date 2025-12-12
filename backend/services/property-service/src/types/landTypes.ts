import { IFileRef } from "./sharedTypes";

export const LAND_PROPERTY_TYPES = [
  "plot",
  "residential-plot",
  "commercial-plot",
  "industrial-plot",
  "investment-plot",
  "corner-plot",
  "na-plot", // non-agricultural approved
] as const;

export type LandPropertyType = (typeof LAND_PROPERTY_TYPES)[number];

export const LAND_PROPERTY_SUBTYPES = [
  "east-facing",
  "west-facing",
  "north-facing",
  "south-facing",

  "gated-community",
  "non-gated",
  "corner",
  "road-facing",
  "two-side-open",
  "three-side-open",

  "resale",
  "new-plot",
] as const;

export type LandPropertySubType = (typeof LAND_PROPERTY_SUBTYPES)[number];

export interface ILand {
  dimensions: {
    length: { type: Number; required: true }; // e.g., 40
    width: { type: Number; required: true }; // e.g., 60
  };

  propertyType?: LandPropertyType;
  propertySubType?: LandPropertySubType;

  plotArea?: number;
  plotAreaUnit?: "sqft" | "sqmt" | "acre" | "guntha" | "kanal" | "hectare";
  roadWidthFt?: number;
  negotiable?: boolean;
  readyToConstruct?: boolean;
  waterConnection?: boolean;
  electricityConnection?: boolean;
  approvedByAuthority?: string[];
  facing?: string;
  cornerPlot?: boolean;
  fencing?: boolean;
  landUseZone?: string;
  conversionCertificateFile?: IFileRef | null;
  encumbranceCertificateFile?: IFileRef | null;
  soilTestReport?: IFileRef | null;
  surveyNumber?: string;
  layoutType?: string;
}
