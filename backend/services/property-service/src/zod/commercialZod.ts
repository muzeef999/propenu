import { z } from "zod";

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
const coerceEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((v) => {
    if (typeof v === "string") return v.trim();
    return v;
  }, z.enum(values));

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

/** Gallery item (optional metadata for create/update) */
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
  leaseStart: z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date().optional()),
  leaseEnd: z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date().optional()),
  rent: coerceNumber(z.number()).optional(),
});

/* ----------------------
   Base fields (re-usable)
   ---------------------- */

const BaseCreate = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  listingType: coerceEnum(["sale", "rent", "lease"] as const).optional().default("sale"),
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
  mapEmbedUrl: z.string().url().optional(),
  price: coerceNumber(z.number()).optional(),
  currency: z.string().optional().default("INR"),
  gallery: z.array(GalleryItem).optional().default([]),
  documents: z.array(FileMetaZ).optional().default([]),
  // base metadata
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
  status: coerceEnum(["active", "inactive", "archived"] as const).optional().default("active"),
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

  // furnishing - enum needs trimming
  furnishedStatus: coerceEnum(["unfurnished", "semi-furnished", "fully-furnished"] as const).optional(),

  // utilities & facilities
  powerBackup: z.string().optional(),
  powerCapacityKw: coerceNumber(z.number()).optional(),
  lift: coerceBoolean(z.boolean()).optional(),
  washrooms: coerceInt(z.number().int()).optional(),
  ceilingHeightFt: coerceNumber(z.number()).optional(),
  builtYear: coerceInt(z.number().int()).optional(),
  maintenanceCharges: coerceNumber(z.number()).optional(),

  // safety & docs
  fireSafety: coerceBoolean(z.boolean()).optional(),
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
});

/* ----------------------
   Commercial Update Schema (PATCH)
   -> all fields optional, arrays DO NOT default (so a patch won't accidentally overwrite)
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

    gallery: z.array(GalleryItem).optional(),
    documents: z.array(FileMetaZ).optional(),

    floorNumber: coerceInt(z.number().int()).optional(),
    totalFloors: coerceInt(z.number().int()).optional(),
    furnishedStatus: coerceEnum(["unfurnished", "semi-furnished", "fully-furnished"] as const).optional(),
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
    tenantInfo: z.array(TenantInfoItem).optional(),
    zoning: z.string().optional(),
    occupancyCertificateFile: FileMetaZ.optional().nullable(),
    leaseDocuments: z.array(FileMetaZ).optional(),
    buildingManagement: z
      .object({
        security: coerceBoolean(z.boolean()).optional(),
        managedBy: z.string().optional(),
        contact: z.string().optional(),
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
    status: coerceEnum(["active", "inactive", "archived"] as const).optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
  })
  .partial();

/* ---- Types exported ---- */
export type CreateCommercialDTO = z.infer<typeof CreateCommercialSchema>;
export type UpdateCommercialDTO = z.infer<typeof UpdateCommercialSchema>;
