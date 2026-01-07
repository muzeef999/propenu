import { z } from "zod";
import { AGRICULTURAL_PROPERTY_SUBTYPES, AGRICULTURAL_PROPERTY_TYPES } from "../types/agriculturalTypes";

/* ----------------------
   Helpers
   ---------------------- */
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

/* small helper: try parse JSON string -> fallback to original value */
function tryParseJson(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    // leave as-is (string) and let subsequent schema validation fail if required
    return value;
  }
}

/* ----------------------
   Sub-schemas
   ---------------------- */
export const FileMetaZ = z.object({
  url: z.string().url().optional(),
  key: z.string().optional(),
  filename: z.string().optional(),
  mimetype: z.string().optional(),
});

const GalleryItem = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  filename: z.string().optional(),
  order: coerceInt(z.number().int()).optional(),
  caption: z.string().optional(),
});

const LeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  location: z.string().optional(),
  message: z.string().optional(),
  createdAt: z.string().optional(),
});

/* ----------------------
   Base fields (reuse idea of BaseResidentialCreate)
   If you have a shared base, import & extend instead.
   ---------------------- */

/**
 * Helper preprocessors for enums that may arrive as messy strings from form-data
 */
const preprocessEnumString = (allowed: readonly string[]) =>
  z.preprocess((v) => {
    if (typeof v === "string") return v.trim().toLowerCase();
    return v;
  }, z.enum(allowed as any));

const preprocessArrayJsonOrValue = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => tryParseJson(v), z.array(schema));

const preprocessObjJsonOrValue = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => tryParseJson(v), schema);

/* BaseCreate with enum preprocess on listingType & status,
   and JSON-string-accepting documents & gallery */
const BaseCreate = z.object({
  
  slug: z.string().optional(),

  // listingType: normalize input then validate enum
  listingType: preprocessEnumString(["sale", "rent", "lease"]).optional().default("sale"),
  description: z.string().optional(),
  createdBy: z.string().optional(),
  listingSource: z.string().optional(),

  developer: z.string().optional(),
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
  price: coerceNumber(z.number()).optional(),
  currency: z.string().optional().default("INR"),

  // gallery can be sent as JSON string or object array
  gallery: preprocessArrayJsonOrValue(GalleryItem).optional().default([]),

  // documents: accept JSON string representing array of FileMetaZ OR files uploaded
  documents: preprocessArrayJsonOrValue(FileMetaZ).optional().default([]),

  leads: z.array(LeadSchema).optional().default([]),

  // status: normalize then validate
  status: preprocessEnumString(["active", "inactive", "archived"]).optional().default("active"),
});

/* ----------------------
   Agricultural CREATE schema
   ---------------------- */
export const AgriculturalCreateSchema = BaseCreate.extend({
  boundaryWall: coerceBoolean(z.boolean()).optional(),
  areaUnit: z.string().optional(), // e.g., acres/hectare/sqft
  landShape: z.string().optional(),
  soilType: z.string().optional(),
  irrigationType: z.string().optional(),
    locality: z.string().min(1), // ✅ ADD THIS
  currentCrop: z.string().optional(),
  suitableFor: z.string().optional(),
  plantationAge: coerceNumber(z.number()).optional(),
  numberOfBorewells: coerceInt(z.number().int()).optional(),
  landName: z.string().trim().optional(),

  totalArea:preprocessObjJsonOrValue(
    z.object({
      value: coerceNumber(z.number()),
      unit: z.string(),
    })
  ).optional(),

  roadWidth: preprocessObjJsonOrValue(
    z.object({
      value: coerceNumber(z.number()),
      unit: z.string(),
    })
  ).optional(),

  borewellDetails: z
    .preprocess((v) => tryParseJson(v), // allow JSON string for entire object
      z
        .object({
          depthMeters: coerceNumber(z.number()).optional(),
          yieldLpm: coerceNumber(z.number()).optional(),
          drilledYear: coerceInt(z.number().int()).optional(),
          // files can be JSON string or array of FileMetaZ
          files: preprocessArrayJsonOrValue(FileMetaZ).optional().default([]),
        })
        .optional()
    ),

  electricityConnection: coerceBoolean(z.boolean()).optional(),
  waterSource: z.string().optional(),
  accessRoadType: z.string().optional(),

  // soilTestReport: accept JSON string -> FileMetaZ OR null
  soilTestReport: preprocessObjJsonOrValue(FileMetaZ).optional().nullable(),

  statePurchaseRestrictions: z.string().optional(),

  // agriculturalUseCertificate: accept JSON string -> FileMetaZ OR null
  agriculturalUseCertificate: preprocessObjJsonOrValue(FileMetaZ).optional().nullable(),

  
     propertyType: enumPreprocess(
      AGRICULTURAL_PROPERTY_TYPES as readonly [string, ...string[]]
    ).optional(),
  
    propertySubType: enumPreprocess(
      AGRICULTURAL_PROPERTY_SUBTYPES as readonly [string, ...string[]]
    ).optional(),
});

/* ----------------------
   Agricultural UPDATE schema (PATCH)
   - all fields optional, arrays do not default
   ---------------------- */
export const AgriculturalUpdateSchema = AgriculturalCreateSchema.partial();

/* ---- Types ---- */
export type CreateAgriculturalDTO = z.infer<typeof AgriculturalCreateSchema>;
export type UpdateAgriculturalDTO = z.infer<typeof AgriculturalUpdateSchema>;
