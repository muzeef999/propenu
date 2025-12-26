// src/zod/residentialValidation.ts
import { z } from "zod";
import { RESIDENTIAL_PROPERTY_TYPES } from "../types/residentialTypes";


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
  order: z.coerce.number().int().optional(),
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
  order: z.coerce.number().int().optional().default(0),
});

const NearbyPlaceSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  distanceText: z.string().optional(),
  coordinates: z.tuple([z.coerce.number(), z.coerce.number()]).optional(), // [lng, lat]
  order: z.coerce.number().int().optional().default(0),
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
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  // listingType normalized via z.enum — default 'sale'
  listingType: z.enum(["sale", "rent", "lease"]).optional().default("sale"),
  developer: z.string().optional(),
  address: z.string().min(1),
  description: z.string().optional(),
  locality: z.string().min(1, "Locality is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  location: z
    .object({
      type: z.literal("Point").optional().default("Point"),
      coordinates: z.tuple([z.coerce.number(), z.coerce.number()]).optional(),
    })
    .optional(), 
  mapEmbedUrl: z.string().url().optional(),
  currency: z.string().optional().default("INR"),
   price: z.coerce.number().optional(),
  pricePerSqft: z.coerce.number().optional(),
  gallery: z.array(GallerySummarySchema).optional().default([]),
  documents: z.array(FileMetaZ).optional().default([]),
  specifications: z.array(SpecificationSchema).optional().default([]),
  amenities: z.array(AmenitySchema).optional().default([]),
  nearbyPlaces: z.array(NearbyPlaceSchema).optional().default([]),
  leads: z.array(LeadSchema).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  rank: z.coerce.number().int().optional().default(1),
  meta: z
    .object({
      views: z.coerce.number().int().optional().default(0),
      inquiries: z.coerce.number().int().optional().default(0),
      clicks: z.coerce.number().int().optional().default(0),
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
  bhk: z.coerce.number().int().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  balconies: z.coerce.number().int().optional(),
  buildingName: z.string().optional(),

  transactionType: z.enum(
    ["new-sale", "resale", "pre-leased", "rent", "lease"] as const
  ).optional(),

  // areas & sizes
  carpetArea: z.coerce.number().optional(),
  builtUpArea: z.coerce.number().optional(),
  superBuiltUpArea: z.coerce.number().optional(),

   propertyType: z.enum(
    RESIDENTIAL_PROPERTY_TYPES as readonly [string, ...string[]]
  ).optional(),

  sqftRange: z
    .object({
      min: z.coerce.number().optional(),
      max: z.coerce.number().optional(),
    })
    .optional(),

  // NEW: flooring / kitchen / age
  flooringType: z.enum(FLOORING_TYPES).optional(),
  kitchenType: z.enum(KITCHEN_TYPES).optional(),
  propertyAge: z.enum(PROPERTY_AGE_BUCKETS).optional(),
  constructionYear: (z.coerce.number().int()).optional(),
  isModularKitchen: (z.coerce.boolean()).optional(),

  isPriceNegotiable: z.boolean().optional(),


  // furnishing: normalize and accept case/space/array issues
  furnishing: z.enum(["unfurnished", "semi-furnished", "fully-furnished"]).optional(),

  parkingType: z.string().optional(),

  // floor info
  floorNumber: (z.coerce.number().int()).optional(),
  totalFloors: (z.coerce.number().int()).optional(),

  facing: z.string().optional(),
  // constructionStatus: normalized
  constructionStatus: z.enum(["ready-to-move", "under-construction"]).optional(),

  possessionDate: z.preprocess(
    (v) => (v ? new Date(v as string) : undefined),
    z.date().optional()
  ),
  maintenanceCharges: (z.coerce.number()).optional(),
  possessionVerified: (z.boolean()).optional(),

  parkingDetails: z
    .object({
      visitorParking: (z.boolean().optional()).optional(),
      twoWheeler: (z.coerce.number().int()).optional(),
      fourWheeler: (z.coerce.number().int()).optional(),
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
    listingType: z.enum(["sale", "rent", "lease"]).optional(),
    developer: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    buildingName: z.string().optional(),
    locality: z.string().min(1, "Locality is required"),
    city: z.string().optional(),
    isPriceNegotiable: z.boolean().optional(),
    transactionType: z.enum(
    ["new-sale", "resale", "pre-leased", "rent", "lease"] as const
  ).optional(),

   propertyType: z.enum(
      RESIDENTIAL_PROPERTY_TYPES as readonly [string, ...string[]]
    ).optional(),


    state: z.string().optional(),
    pincode: z.string().optional(),
    location: z
      .object({
        type: z.literal("Point").optional(),
        coordinates: z.tuple([z.coerce.number(), z.coerce.number()]).optional(),
      })
      .optional(),
    mapEmbedUrl: z.string().url().optional(),
    currency: z.string().optional(),
    price: z.coerce.number().optional(),
    pricePerSqft: z.coerce.number().optional(),

    // IMPORTANT: arrays — do NOT overwrite with []
    gallery: optionalNonEmptyArray(GallerySummarySchema),
    documents: optionalNonEmptyArray(FileMetaZ),
    specifications: optionalNonEmptyArray(SpecificationSchema),
    amenities: optionalNonEmptyArray(AmenitySchema),
    nearbyPlaces: optionalNonEmptyArray(NearbyPlaceSchema),
    leads: optionalNonEmptyArray(LeadSchema),

    bhk: (z.coerce.number().int()).optional(),
    bedrooms: (z.coerce.number().int()).optional(),
    bathrooms: (z.coerce.number().int()).optional(),
    balconies: (z.coerce.number().int()).optional(),

    carpetArea: (z.coerce.number()).optional(),
    builtUpArea: (z.coerce.number()).optional(),
    superBuiltUpArea: (z.coerce.number()).optional(),

    sqftRange: z
      .object({
        min: (z.coerce.number()).optional(),
        max: (z.coerce.number()).optional(),
      })
      .optional(),

    // NEW: flooring / kitchen / age
    flooringType: z.enum(FLOORING_TYPES).optional(),
    kitchenType: z.enum(KITCHEN_TYPES).optional(),
    propertyAge: z.enum(PROPERTY_AGE_BUCKETS).optional(),
    constructionYear: (z.coerce.number().int()).optional(),
    isModularKitchen: (z.coerce.boolean()).optional(),

    furnishing: z.enum(["unfurnished", "semi-furnished", "fully-furnished"]).optional(),
    parkingType: z.string().optional(),

    floorNumber: (z.coerce.number().int()).optional(),
    totalFloors: (z.coerce.number().int()).optional(),

    facing: z.string().optional(),
    constructionStatus: z.enum(["ready-to-move", "under-construction"]).optional(),
    possessionDate: z.preprocess(
      (v) => (v ? new Date(v as string) : undefined),
      z.date().optional()
    ),
    maintenanceCharges: (z.coerce.number()).optional(),
    possessionVerified: (z.boolean()).optional(),

    parkingDetails: z
      .object({
        visitorParking: (z.boolean().optional()).optional(),
        twoWheeler: (z.coerce.number().int()).optional(),
        fourWheeler: (z.coerce.number().int()).optional(),
      })
      .optional(),

    isFeatured: (z.boolean()).optional(),
    rank: (z.coerce.number().int()).optional(),

    meta: z
      .object({
        views: (z.coerce.number().int()).optional(),
        inquiries: (z.coerce.number().int()).optional(),
        clicks: (z.coerce.number().int()).optional(),
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
