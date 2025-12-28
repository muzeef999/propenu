import { z } from "zod";
import {
  LAND_PROPERTY_SUBTYPES,
  LAND_PROPERTY_TYPES,
} from "../types/landTypes";

const coerceNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => {
    if (v === "" || v === null || typeof v === "undefined") return undefined;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed === "") return undefined;
      const n = Number(trimmed);
      return Number.isNaN(n) ? v : n;
    }
    return v;
  }, schema);

const coerceInt = (schema: z.ZodNumber) =>
  z.preprocess((v) => {
    if (v === "" || v === null || typeof v === "undefined") return undefined;
    if (typeof v === "number") return Math.trunc(v);
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed === "") return undefined;
      const n = Number(trimmed);
      return Number.isNaN(n) ? v : Math.trunc(n);
    }
    return v;
  }, schema);

const coerceBoolean = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => {
    if (v === "" || v === null || typeof v === "undefined") return undefined;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "true") return true;
      if (s === "false") return false;
    }
    return v;
  }, schema);

const preprocessEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => {
    if (typeof v === "string") return v.trim().toLowerCase();
    return v;
  }, z.enum(values as any));

/* ----------------------
   sub-schemas
   ---------------------- */
export const FileMetaZ = z.object({
  url: z.string().url().optional(),
  key: z.string().optional(),
  filename: z.string().optional(),
  mimetype: z.string().optional(),
  title: z.string().optional(),
});

const GallerySummarySchema = z.object({
  title: z.string().optional(), 
  url: z.string().url().optional(),
  category: z.string().optional(),
  order: coerceInt(z.number().int()).optional(),
  filename: z.string().optional(),
  caption: z.string().optional(),
});

const BorewellFiles = z.array(FileMetaZ).optional().default([]);
const BorewellDetails = z
  .object({
    depthMeters: coerceNumber(z.number()).optional(),
    yieldLpm: coerceNumber(z.number()).optional(),
    drilledYear: coerceInt(z.number().int()).optional(),
    files: BorewellFiles,
  })
  .optional();

export const DimensionsSchema = z.object({
  length: z.preprocess((v) => {
    if (v === null || typeof v === "undefined") return undefined;
    if (typeof v === "number") return String(v);
    if (typeof v === "string") return v.trim();
    return v;
  }, z.string().optional()),
  width: z.preprocess((v) => {
    if (v === null || typeof v === "undefined") return undefined;
    if (typeof v === "number") return String(v);
    if (typeof v === "string") return v.trim();
    return v;
  }, z.string().optional()),
});

/* ----------------------
   base fields (match BaseFields used in model)
   ---------------------- */
const BaseCreate = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  listingType: preprocessEnum(["buy", "rent", "lease"] as const)
    .optional()
    .default("buy"),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  locality: z.string().min(1, "Locality is required"),
  pincode: z.string().optional(),
  description: z.string().optional(),
  landName: z.string().trim().optional(),

  location: z
    .object({
      type: z.literal("Point").optional().default("Point"),
      coordinates: z.tuple([z.number(), z.number()]).optional(),
    })
    .optional(),
  mapEmbedUrl: z.string().url().optional(),
  currency: z.string().optional().default("INR"),
  price: coerceNumber(z.number()).optional(),
  pricePerSqft: coerceNumber(z.number()).optional(),
  gallery: z.array(GallerySummarySchema).optional().default([]),
  documents: z.array(FileMetaZ).optional().default([]),
  dimensions: DimensionsSchema,
  specifications: z.array(z.any()).optional().default([]),
  amenities: z.array(z.any()).optional().default([]),
  nearbyPlaces: z.array(z.any()).optional().default([]),
  leads: z.array(z.any()).optional().default([]),
  isFeatured: coerceBoolean(z.boolean()).optional().default(false),
  rank: coerceInt(z.number().int()).optional().default(1),
  meta: z
    .object({
      views: coerceInt(z.number().int()).optional().default(0),
      inquiries: coerceInt(z.number().int()).optional().default(0),
      clicks: coerceInt(z.number().int()).optional().default(0),
    })
    .optional()
    .default(() => ({ views: 0, inquiries: 0, clicks: 0 } as const)),
  status: preprocessEnum(["active", "inactive", "archived"] as const)
    .optional()
    .default("active"),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

/* ----------------------
   Land create & update schemas
   ---------------------- */
export const CreateLandSchema = BaseCreate.extend({
  plotArea: coerceNumber(z.number()).optional(),
  plotAreaUnit: preprocessEnum([
    "sqft",
    "sqmt",
    "acre",
    "guntha",
    "kanal",
    "hectare",
  ] as const).optional(),
  roadWidthFt: coerceNumber(z.number()).optional(),
  negotiable: coerceBoolean(z.boolean()).optional().default(false),
  readyToConstruct: coerceBoolean(z.boolean()).optional(),
  waterConnection: coerceBoolean(z.boolean()).optional(),
  electricityConnection: coerceBoolean(z.boolean()).optional(),
  approvedByAuthority: z.array(z.string()).optional().default([]),
  facing: z.string().optional(),
  dimensions: DimensionsSchema,

  cornerPlot: coerceBoolean(z.boolean()).optional(),
  fencing: coerceBoolean(z.boolean()).optional(),
  landUseZone: z.string().optional(),
  conversionCertificateFile: FileMetaZ.optional().nullable(),
  encumbranceCertificateFile: FileMetaZ.optional().nullable(),
  soilTestReport: FileMetaZ.optional().nullable(),
  surveyNumber: z.string().optional(),
  layoutType: z.string().optional(),
  propertyType: preprocessEnum(LAND_PROPERTY_TYPES).optional(),
  propertySubType: preprocessEnum(LAND_PROPERTY_SUBTYPES).optional(),
});

export const UpdateLandSchema = CreateLandSchema.partial();

/* ---- types ---- */
export type CreateLandDTO = z.infer<typeof CreateLandSchema>;
export type UpdateLandDTO = z.infer<typeof UpdateLandSchema>;
