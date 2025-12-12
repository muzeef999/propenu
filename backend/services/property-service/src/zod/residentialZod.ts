// src/zod/residentialValidation.ts
import { z } from "zod";
import { RESIDENTIAL_PROPERTY_SUBTYPES, RESIDENTIAL_PROPERTY_TYPES } from "../types/residentialTypes";


const FLOORING_TYPES = [
  "vitrified",
  "marble",
  "granite",
  "wooden",
  "ceramic-tiles",
  "mosaic",
  "normal-tiles",
  "cement",
  "other",
] as const;

const KITCHEN_TYPES = ["open",
  "closed",
  "semi-open",
  "island",
  "parallel",
  "u-shaped",
  "l-shaped",
] as const;

const PROPERTY_AGE_BUCKETS = [
  "under-construction",
  "0-1-year",
  "1-5-years",
  "5-10-years",
  "10-20-years",
  "20-plus-years",
] as const;

const coerceNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => {
    if (v === "" || v === null || typeof v === "undefined") return undefined;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    }
    return v;
  }, schema);


  const coerceInt = (schema: z.ZodNumber) =>
  z.preprocess((v) => {
    if (v === "" || v === null || typeof v === "undefined") return undefined;
    if (typeof v === "number") return Math.trunc(v);
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isNaN(n) ? v : Math.trunc(n);
    }
    return v;
  }, schema);



   const coerceEnum = <T extends readonly [string, ...string[]]>(values: T) =>
     z.preprocess(
       (v) => {
         if (typeof v === "string") return v.trim();
         return v;
       },
       z.enum([...values] as [string, ...string[]])
     );



/** coerce booleans ("true"/"false") */
const coerceBoolean = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => {
    if (v === "" || v === null || typeof v === "undefined") return undefined;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.toLowerCase().trim();
      if (s === "true") return true;
      if (s === "false") return false;
    }
    return v;
  }, schema);

function enumPreprocess<T extends readonly [string, ...string[]]>(choices: T) {
  // spread into a mutable tuple for z.enum typing
  const enumSchema = z.enum([...choices] as [string, ...string[]]);

  return z.preprocess((v) => {
    if (Array.isArray(v) && v.length > 0) v = v[0];
    if (typeof v === "string") {
      return v.trim().toLowerCase();
    }
    return v;
  }, enumSchema);
}

/**
 * For PATCH: if frontend sends [] for arrays we don't want to wipe existing data.
 * This converts [] -> undefined, so Mongo won't overwrite the field.
 */
const optionalNonEmptyArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (v) => {
      if (Array.isArray(v) && v.length === 0) return undefined;
      return v;
    },
    z.array(schema).optional()
  );

/* ----------------------
   Sub-schemas (reused)
   ---------------------- */

export const FileMetaZ = z.object({
  url: z.string().url().optional(),
  key: z.string().optional(),
  filename: z.string().optional(),
  mimetype: z.string().optional(),
});

const GallerySummarySchema = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  category: z.string().optional(),
  order: coerceInt(z.number().int()).optional(),
  filename: z.string().optional(),
  caption: z.string().optional(),
});

const AmenitySchema = z.object({
  key: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const SpecificationItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

const SpecificationSchema = z.object({
  category: z.string().optional(),
  items: z.array(SpecificationItemSchema).optional(),
  order: coerceInt(z.number().int()).optional().default(0),
});

const NearbyPlaceSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  distanceText: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(), // [lng, lat]
  order: coerceInt(z.number().int()).optional().default(0),
});

const LeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  location: z.string().optional(),
  message: z.string().max(2000).optional(),
  createdAt: z.string().optional(),
});

/* ----------------------
   Base-like fields (common)
   ---------------------- */

const BaseResidentialCreate = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  // listingType normalized via enumPreprocess — default 'sale'
  listingType: enumPreprocess(["sale", "rent", "lease"]).optional().default("sale"),
  developer: z.string().optional(),
  address: z.string().min(1),
  description: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
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
  specifications: z.array(SpecificationSchema).optional().default([]),
  amenities: z.array(AmenitySchema).optional().default([]),
  nearbyPlaces: z.array(NearbyPlaceSchema).optional().default([]),
  leads: z.array(LeadSchema).optional().default([]),
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
  status: z.enum(["active", "inactive", "archived"]).optional().default("active"),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

/* ----------------------
   Residential Create Schema
   (POST)
   ---------------------- */

export const ResidentialCreateSchema = BaseResidentialCreate.extend({
  // residential-specific numeric / counts
  bhk: coerceInt(z.number().int()).optional(),
  bedrooms: coerceInt(z.number().int()).optional(),
  bathrooms: coerceInt(z.number().int()).optional(),
  balconies: coerceInt(z.number().int()).optional(),
  buildingName: z.string().optional(),

  transactionType: coerceEnum(
    ["new-sale", "resale", "pre-leased", "rent", "lease"] as const
  ).optional(),

  // areas & sizes
  carpetArea: coerceNumber(z.number()).optional(),
  builtUpArea: coerceNumber(z.number()).optional(),
  superBuiltUpArea: coerceNumber(z.number()).optional(),

   propertyType: enumPreprocess(
    RESIDENTIAL_PROPERTY_TYPES as readonly [string, ...string[]]
  ).optional(),

  propertySubType: enumPreprocess(
    RESIDENTIAL_PROPERTY_SUBTYPES as readonly [string, ...string[]]
  ).optional(),

  sqftRange: z
    .object({
      min: coerceNumber(z.number()).optional(),
      max: coerceNumber(z.number()).optional(),
    })
    .optional(),

  // NEW: flooring / kitchen / age
  flooringType: enumPreprocess(FLOORING_TYPES).optional(),
  kitchenType: enumPreprocess(KITCHEN_TYPES).optional(),
  propertyAge: enumPreprocess(PROPERTY_AGE_BUCKETS).optional(),
  constructionYear: coerceInt(z.number().int()).optional(),
  isModularKitchen: coerceBoolean(z.boolean()).optional(),

  // furnishing: normalize and accept case/space/array issues
  furnishing: enumPreprocess(["unfurnished", "semi-furnished", "fully-furnished"]).optional(),

  parkingType: z.string().optional(),
  parkingCount: coerceInt(z.number().int()).optional(),

  // floor info
  floorNumber: coerceInt(z.number().int()).optional(),
  totalFloors: coerceInt(z.number().int()).optional(),

  facing: z.string().optional(),
  // constructionStatus: normalized
  constructionStatus: enumPreprocess(["ready-to-move", "under-construction"]).optional(),

  possessionDate: z.preprocess(
    (v) => (v ? new Date(v as string) : undefined),
    z.date().optional()
  ),
  maintenanceCharges: coerceNumber(z.number()).optional(),
  possessionVerified: coerceBoolean(z.boolean()).optional(),

  // security / certifications
  security: z
    .object({
      gated: coerceBoolean(z.boolean().optional()).optional(),
      cctv: coerceBoolean(z.boolean().optional()).optional(),
      guard: coerceBoolean(z.boolean().optional()).optional(),
      details: z.string().optional(),
    })
    .optional(),

  fireSafetyDetails: z
    .object({
      hasFireSafety: coerceBoolean(z.boolean().optional()).optional(),
      fireNOCFile: FileMetaZ.optional().nullable(),
      details: z.string().optional(),
    })
    .optional(),

  greenCertification: z
    .object({
      leed: coerceBoolean(z.boolean().optional()).optional(),
      igbc: coerceBoolean(z.boolean().optional()).optional(),
      details: z.string().optional(),
      file: FileMetaZ.optional().nullable(),
    })
    .optional(),

  smartHomeFeatures: z.array(z.string()).optional().default([]),

  parkingDetails: z
    .object({
      visitorParking: coerceBoolean(z.boolean().optional()).optional(),
      twoWheeler: coerceInt(z.number().int()).optional(),
      fourWheeler: coerceInt(z.number().int()).optional(),
    })
    .optional(),
});

/* ----------------------
   Residential Update Schema
   (PATCH)
   - every field optional
   - arrays do NOT default
   - empty arrays are treated as "no change"
   ---------------------- */

export const ResidentialUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    slug: z.string().optional(),
    // normalized listingType
    listingType: enumPreprocess(["sale", "rent", "lease"]).optional(),
    developer: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    buildingName: z.string().optional(),
    city: z.string().optional(),
    transactionType: coerceEnum(
    ["new-sale", "resale", "pre-leased", "rent", "lease"] as const
  ).optional(),

   propertyType: enumPreprocess(
      RESIDENTIAL_PROPERTY_TYPES as readonly [string, ...string[]]
    ).optional(),

    propertySubType: enumPreprocess(
      RESIDENTIAL_PROPERTY_SUBTYPES as readonly [string, ...string[]]
    ).optional(),

    state: z.string().optional(),
    pincode: z.string().optional(),
    location: z
      .object({
        type: z.literal("Point").optional(),
        coordinates: z.tuple([z.number(), z.number()]).optional(),
      })
      .optional(),
    mapEmbedUrl: z.string().url().optional(),
    currency: z.string().optional(),
    price: coerceNumber(z.number()).optional(),
    pricePerSqft: coerceNumber(z.number()).optional(),

    // IMPORTANT: arrays — do NOT overwrite with []
    gallery: optionalNonEmptyArray(GallerySummarySchema),
    documents: optionalNonEmptyArray(FileMetaZ),
    specifications: optionalNonEmptyArray(SpecificationSchema),
    amenities: optionalNonEmptyArray(AmenitySchema),
    nearbyPlaces: optionalNonEmptyArray(NearbyPlaceSchema),
    leads: optionalNonEmptyArray(LeadSchema),

    bhk: coerceInt(z.number().int()).optional(),
    bedrooms: coerceInt(z.number().int()).optional(),
    bathrooms: coerceInt(z.number().int()).optional(),
    balconies: coerceInt(z.number().int()).optional(),

    carpetArea: coerceNumber(z.number()).optional(),
    builtUpArea: coerceNumber(z.number()).optional(),
    superBuiltUpArea: coerceNumber(z.number()).optional(),

    sqftRange: z
      .object({
        min: coerceNumber(z.number()).optional(),
        max: coerceNumber(z.number()).optional(),
      })
      .optional(),

    // NEW: flooring / kitchen / age
    flooringType: enumPreprocess(FLOORING_TYPES).optional(),
    kitchenType: enumPreprocess(KITCHEN_TYPES).optional(),
    propertyAge: enumPreprocess(PROPERTY_AGE_BUCKETS).optional(),
    constructionYear: coerceInt(z.number().int()).optional(),
    isModularKitchen: coerceBoolean(z.boolean()).optional(),

    furnishing: enumPreprocess(["unfurnished", "semi-furnished", "fully-furnished"]).optional(),
    parkingType: z.string().optional(),
    parkingCount: coerceInt(z.number().int()).optional(),

    floorNumber: coerceInt(z.number().int()).optional(),
    totalFloors: coerceInt(z.number().int()).optional(),

    facing: z.string().optional(),
    constructionStatus: enumPreprocess(["ready-to-move", "under-construction"]).optional(),
    possessionDate: z.preprocess(
      (v) => (v ? new Date(v as string) : undefined),
      z.date().optional()
    ),
    maintenanceCharges: coerceNumber(z.number()).optional(),
    possessionVerified: coerceBoolean(z.boolean()).optional(),

    security: z
      .object({
        gated: coerceBoolean(z.boolean().optional()).optional(),
        cctv: coerceBoolean(z.boolean().optional()).optional(),
        guard: coerceBoolean(z.boolean().optional()).optional(),
        details: z.string().optional(),
      })
      .optional(),

    fireSafetyDetails: z
      .object({
        hasFireSafety: coerceBoolean(z.boolean().optional()).optional(),
        fireNOCFile: FileMetaZ.optional().nullable(),
        details: z.string().optional(),
      })
      .optional(),

    greenCertification: z
      .object({
        leed: coerceBoolean(z.boolean().optional()).optional(),
        igbc: coerceBoolean(z.boolean().optional()).optional(),
        details: z.string().optional(),
        file: FileMetaZ.optional().nullable(),
      })
      .optional(),

    smartHomeFeatures: optionalNonEmptyArray(z.string()),

    parkingDetails: z
      .object({
        visitorParking: coerceBoolean(z.boolean().optional()).optional(),
        twoWheeler: coerceInt(z.number().int()).optional(),
        fourWheeler: coerceInt(z.number().int()).optional(),
      })
      .optional(),

    isFeatured: coerceBoolean(z.boolean()).optional(),
    rank: coerceInt(z.number().int()).optional(),

    meta: z
      .object({
        views: coerceInt(z.number().int()).optional(),
        inquiries: coerceInt(z.number().int()).optional(),
        clicks: coerceInt(z.number().int()).optional(),
      })
      .optional(),

    status: z.enum(["active", "inactive", "archived"]).optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
  })
  .partial();

/* ---- Types ---- */
export type CreateResidentialDTO = z.infer<typeof ResidentialCreateSchema>;
export type UpdateResidentialDTO = z.infer<typeof ResidentialUpdateSchema>;
