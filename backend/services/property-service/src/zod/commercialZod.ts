// src/zod/commercialValidation.ts
import { z } from "zod";
import {
  COMMERCIAL_PROPERTY_TYPES,
  COMMERCIAL_PROPERTY_SUBTYPES,
  PANTRY_TYPES,
  FLOORING_TYPES,
  WALL_FINISH_STATUS,
} from "../types/commercialTypes";

/* ----------------------
   Coercion helpers
   ---------------------- */

/** coerce "string number" => number; returns undefined for empty/null */
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

/** coerce an integer-like value */
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

/** coerce booleans that may come as "true"/"false", " true", " False" etc. */
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

/** helper to coerce + trim string before enum validation */
const coerceEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => {
    if (typeof v === "string") return v.trim();
    return v;
  }, z.enum([...values] as [string, ...string[]]));

/** parse JSON string -> value, or passthrough if already object/array */
const parseJsonIfString = (v: unknown) => {
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return undefined;
    try {
      return JSON.parse(trimmed);
    } catch {
      return v; // let Zod throw a proper validation error
    }
  }
  return v;
};

/**
 * For arrays that may come as:
 * - real arrays (from JSON body)
 * - JSON strings representing arrays (from form-data)
 */
const jsonArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(parseJsonIfString, z.array(schema));

/**
 * For PATCH arrays:
 * - [] or "[]"  -> treat as "no change" (undefined)
 * - non-empty array / JSON string array -> validate normally
 */
const optionalNonEmptyJsonArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => {
    v = parseJsonIfString(v);
    if (Array.isArray(v) && v.length === 0) return undefined;
    return v;
  }, z.array(schema).optional());

/** Same idea for plain objects (like pantry) */
const jsonObject = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(parseJsonIfString, schema);

/* ----------------------
   Sub-schemas
   ---------------------- */

/** File metadata shape (FileRefSchema equivalent) */
export const FileMetaZ = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  key: z.string().optional(),
  filename: z.string().optional(),
  mimetype: z.string().optional(),
  uploadedAt: z.string().optional(),
});

/** Gallery item */
const GalleryItem = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  filename: z.string().optional(),
  order: coerceInt(z.number().int()).optional(),
  caption: z.string().optional(),
});

/** Tenant info item */
const TenantInfoItem = z.object({
  currentTenant: z.string().optional(),
  leaseStart: z.preprocess(
    (v) => (v ? new Date(String(v)) : undefined),
    z.date().optional()
  ),
  leaseEnd: z.preprocess(
    (v) => (v ? new Date(String(v)) : undefined),
    z.date().optional()
  ),
  rent: coerceNumber(z.number()).optional(),
});

/** Amenities / Specifications / Nearby */
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

/** Pantry object */
const PantryZ = z.object({
  type: coerceEnum(PANTRY_TYPES).optional(),
  insidePremises: coerceBoolean(z.boolean()).optional(),
  shared: coerceBoolean(z.boolean()).optional(),
});

const FireSafetyZ = z.object({
  fireExtinguisher: coerceBoolean(z.boolean()).optional(),
  fireSprinklerSystem: coerceBoolean(z.boolean()).optional(),
  fireHoseReel: coerceBoolean(z.boolean()).optional(),
  fireHydrant: coerceBoolean(z.boolean()).optional(),
  smokeDetector: coerceBoolean(z.boolean()).optional(),
  fireAlarmSystem: coerceBoolean(z.boolean()).optional(),
  fireControlPanel: coerceBoolean(z.boolean()).optional(),
  emergencyExitSignage: coerceBoolean(z.boolean()).optional(),
});

const FlooringTypeZ = coerceEnum(FLOORING_TYPES);
const WallFinishStatusZ = coerceEnum(WALL_FINISH_STATUS);

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

/* ----------------------
   Base fields (common)
   ---------------------- */

const BaseCreate = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  listingType: coerceEnum(["sale", "rent", "lease"] as const)
    .optional()
    .default("sale"),
  developer: z.string().optional(),
  buildingName: z.string().optional(),
  address: z.string().min(1),
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
  price: coerceNumber(z.number()).optional(),
  currency: z.string().optional().default("INR"),

  // 🔥 these three can be JSON strings or arrays
  specifications: jsonArray(SpecificationSchema).optional().default([]),
  amenities: jsonArray(AmenitySchema).optional().default([]),
  nearbyPlaces: jsonArray(NearbyPlaceSchema).optional().default([]),

  // media
  gallery: z.array(GalleryItem).optional().default([]),
  documents: z.array(FileMetaZ).optional().default([]),

  // meta
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
  status: coerceEnum(["active", "inactive", "archived"] as const)
    .optional()
    .default("active"),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

/* ----------------------
   Commercial Create Schema (POST)
   ---------------------- */

export const CreateCommercialSchema = BaseCreate.extend({
  // building/floor
  floorNumber: coerceInt(z.number().int()).optional(),
  totalFloors: coerceInt(z.number().int()).optional(),

  // furnishing
  furnishedStatus: coerceEnum([
    "unfurnished",
    "semi-furnished",
    "fully-furnished",
  ] as const).optional(),
  constructionStatus: enumPreprocess([
    "ready-to-move",
    "under-construction",
  ]).optional(),

  wallFinishStatus: WallFinishStatusZ.optional(),
  flooringType: FlooringTypeZ.optional(),

  fireSafety: jsonObject(FireSafetyZ).optional(),

  // utilities & facilities
  powerBackup: z.string().optional(),
  powerCapacityKw: coerceNumber(z.number()).optional(),
  lift: coerceBoolean(z.boolean()).optional(),
  washrooms: coerceInt(z.number().int()).optional(),
  ceilingHeightFt: coerceNumber(z.number()).optional(),
  builtYear: coerceInt(z.number().int()).optional(),
  maintenanceCharges: coerceNumber(z.number()).optional(),

  // safety & docs
  fireNOCFile: FileMetaZ.optional().nullable(),

  // loading / parking
  loadingDock: coerceBoolean(z.boolean()).optional(),
  loadingDockDetails: z.string().optional(),
  parkingCapacity: coerceInt(z.number().int()).optional(),

  // tenants
  tenantInfo: z.array(TenantInfoItem).optional().default([]),

  // zoning & legal
  zoning: z.string().optional(),
  occupancyCertificateFile: FileMetaZ.optional().nullable(),
  leaseDocuments: z.array(FileMetaZ).optional().default([]),

  // building management object
  buildingManagement: z
    .object({
      security: coerceBoolean(z.boolean()).optional(),
      managedBy: z.string().optional(),
      contact: z.string().optional(),
    })
    .optional(),

  /* ---- COMMERCIAL-SPECIFIC FIELDS ---- */

  // property type & subtype
  propertyType: coerceEnum(COMMERCIAL_PROPERTY_TYPES).optional(),
  propertySubType: coerceEnum(COMMERCIAL_PROPERTY_SUBTYPES).optional(),

  // areas
  superBuiltUpArea: coerceNumber(z.number()).optional(),
  carpetArea: coerceNumber(z.number()).optional(),

  // layout
  officeRooms: coerceInt(z.number().int()).optional(),
  cabins: coerceInt(z.number().int()).optional(),
  meetingRooms: coerceInt(z.number().int()).optional(),
  conferenceRooms: coerceInt(z.number().int()).optional(),
  seats: coerceInt(z.number().int()).optional(),

  // transaction type
  transactionType: coerceEnum([
    "new-sale",
    "resale",
    "pre-leased",
    "rent",
    "lease",
  ] as const).optional(),

  // pantry object − also may come as JSON string
  pantry: jsonObject(PantryZ).optional(),
});

/* ----------------------
   Commercial Update Schema (PATCH)
   ---------------------- */

export const UpdateCommercialSchema = z
  .object({
    title: z.string().min(1).optional(),
    slug: z.string().optional(),
    listingType: coerceEnum(["sale", "rent", "lease"] as const).optional(),
    developer: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    buildingName: z.string().optional(),
    pincode: z.string().optional(),
    location: z
      .object({
        type: z.literal("Point").optional(),
        coordinates: z.tuple([z.number(), z.number()]).optional(),
      })
      .optional(),
    mapEmbedUrl: z.string().url().optional(),
    price: coerceNumber(z.number()).optional(),
    currency: z.string().optional(),

    // arrays – don't wipe on [] / "[]", and accept JSON strings
    gallery: optionalNonEmptyJsonArray(GalleryItem),
    documents: optionalNonEmptyJsonArray(FileMetaZ),
    specifications: optionalNonEmptyJsonArray(SpecificationSchema),
    amenities: optionalNonEmptyJsonArray(AmenitySchema),
    nearbyPlaces: optionalNonEmptyJsonArray(NearbyPlaceSchema),

    // building/floor
    floorNumber: coerceInt(z.number().int()).optional(),
    totalFloors: coerceInt(z.number().int()).optional(),

    furnishedStatus: coerceEnum([
      "unfurnished",
      "semi-furnished",
      "fully-furnished",
    ] as const).optional(),

    constructionStatus: enumPreprocess([
      "ready-to-move",
      "under-construction",
    ]).optional(),

    powerBackup: z.string().optional(),
    powerCapacityKw: coerceNumber(z.number()).optional(),
    lift: coerceBoolean(z.boolean()).optional(),
    washrooms: coerceInt(z.number().int()).optional(),
    ceilingHeightFt: coerceNumber(z.number()).optional(),
    builtYear: coerceInt(z.number().int()).optional(),
    maintenanceCharges: coerceNumber(z.number()).optional(),

    fireSafety: coerceBoolean(z.boolean()).optional(),
    fireNOCFile: FileMetaZ.optional().nullable(),

    loadingDock: coerceBoolean(z.boolean()).optional(),
    loadingDockDetails: z.string().optional(),
    parkingCapacity: coerceInt(z.number().int()).optional(),

    tenantInfo: optionalNonEmptyJsonArray(TenantInfoItem),

    zoning: z.string().optional(),
    occupancyCertificateFile: FileMetaZ.optional().nullable(),
    leaseDocuments: optionalNonEmptyJsonArray(FileMetaZ),

    buildingManagement: z
      .object({
        security: coerceBoolean(z.boolean()).optional(),
        managedBy: z.string().optional(),
        contact: z.string().optional(),
      })
      .optional(),

    // commercial specifics
    propertyType: coerceEnum(COMMERCIAL_PROPERTY_TYPES).optional(),
    propertySubType: coerceEnum(COMMERCIAL_PROPERTY_SUBTYPES).optional(),

    superBuiltUpArea: coerceNumber(z.number()).optional(),
    carpetArea: coerceNumber(z.number()).optional(),

    officeRooms: coerceInt(z.number().int()).optional(),
    cabins: coerceInt(z.number().int()).optional(),
    meetingRooms: coerceInt(z.number().int()).optional(),
    conferenceRooms: coerceInt(z.number().int()).optional(),
    seats: coerceInt(z.number().int()).optional(),

    transactionType: coerceEnum([
      "new-sale",
      "resale",
      "pre-leased",
      "rent",
      "lease",
    ] as const).optional(),

    pantry: jsonObject(PantryZ).optional(),

    isFeatured: coerceBoolean(z.boolean()).optional(),
    rank: coerceInt(z.number().int()).optional(),
    meta: z
      .object({
        views: coerceInt(z.number().int()).optional(),
        inquiries: coerceInt(z.number().int()).optional(),
        clicks: coerceInt(z.number().int()).optional(),
      })
      .optional(),
    status: coerceEnum(["active", "inactive", "archived"] as const).optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
  })
  .partial();

/* ---- Types exported ---- */
export type CreateCommercialDTO = z.infer<typeof CreateCommercialSchema>;
export type UpdateCommercialDTO = z.infer<typeof UpdateCommercialSchema>;
