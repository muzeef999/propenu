// src/validation/property/shared.ts
import { z } from "zod";

/* ---------- FileRef, Image, Unit, BhkSummary, Nearby, Lead ---------- */
export const FileRefSchema = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  key: z.string().optional(),
  filename: z.string().optional(),
  mimetype: z.string().optional(),
  uploadedAt: z.preprocess(
    (v) => (v ? new Date(v as string) : undefined),
    z.date().optional()
  ),
});
export type FileRef = z.infer<typeof FileRefSchema>;

export const ImageSchema = z.object({
  url: z.string().url(),
  key: z.string().optional(),
  filename: z.string().optional(),
  mimetype: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  caption: z.string().optional(),
});
export type Image = z.infer<typeof ImageSchema>;

export const UnitSchema = z.object({
  minSqft: z.number().positive().optional(),
  maxSqft: z.number().positive().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  availableCount: z.number().int().nonnegative().optional().default(0),
  plan: FileRefSchema.optional(),
});
export type Unit = z.infer<typeof UnitSchema>;

export const BhkSummarySchema = z.object({
  bhk: z.number().int().nonnegative(),
  bhkLabel: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  units: z.array(UnitSchema).optional().default([]),
});
export type BhkSummary = z.infer<typeof BhkSummarySchema>;

export const NearbyPlaceSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  distanceText: z.string().optional(),
  coordinates: z.array(z.number()).length(2).optional(),
  order: z.number().int().nonnegative().optional(),
});
export type NearbyPlace = z.infer<typeof NearbyPlaceSchema>;

export const SpecItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});
export const SpecificationSchema = z.object({
  category: z.string().optional(),
  items: z.array(SpecItemSchema).optional().default([]),
  order: z.number().int().optional().default(0),
});
export const AmenitySchema = z.object({
  key: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const LeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  location: z.string().optional(),
  message: z.string().optional(),
  createdAt: z.preprocess(
    (v) => (v ? new Date(v as string) : new Date()),
    z.date()
  ),
});
export type Lead = z.infer<typeof LeadSchema>;

/* ---------- Legal / buyer-checks ---------- */
export const LegalChecksSchema = z.object({
  titleDeed: FileRefSchema.optional().nullable(),
  saleDeed: FileRefSchema.optional().nullable(),
  encumbranceCertificate: FileRefSchema.optional().nullable(),
  occupancyCertificate: FileRefSchema.optional().nullable(),
  commencementCertificate: FileRefSchema.optional().nullable(),
  conversionCertificate: FileRefSchema.optional().nullable(),
  reraRegistrationNumber: z.string().optional().nullable(),
  approvals: z.array(z.string()).optional().default([]),
  approvalsFiles: z.array(FileRefSchema).optional().default([]),
  taxReceipts: z.array(FileRefSchema).optional().default([]),
  litigation: z
    .object({
      hasLitigation: z.boolean().optional().default(false),
      details: z.string().optional(),
      documents: z.array(FileRefSchema).optional().default([]),
    })
    .optional()
    .default({ hasLitigation: false, details: undefined, documents: [] }),
  verifiedBy: z
    .object({
      verifierId: z.string().optional(),
      verifiedAt: z.preprocess(
        (v) => (v ? new Date(v as string) : undefined),
        z.date().optional()
      ),
      notes: z.string().optional(),
    })
    .optional()
    .nullable(),
});
export type LegalChecks = z.infer<typeof LegalChecksSchema>;

/* ---------- Base create used by all ---------- */
export const BaseCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  listingSource: z.string().optional(),
  listingType: z.enum(["sale", "rent", "lease"]).optional().default("sale"),
  developer: z.string().optional().nullable(),
  logo: FileRefSchema.optional().nullable(),
  description: z.string().min(1),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  location: z
    .object({
      type: z.literal("Point"),
      coordinates: z.array(z.number()).length(2),
    })
    .optional(),
  mapEmbedUrl: z.string().optional(),

  currency: z.string().optional().default("INR"),
  price: z.number().positive().optional(),
  pricePerSqft: z.number().positive().optional(),

  bhkSummary: z.array(BhkSummarySchema).optional().default([]),

  gallery: z.array(ImageSchema).optional().default([]),
  documents: z.array(FileRefSchema).optional().default([]),
  images: z.array(ImageSchema).optional().default([]),

  specifications: z.array(SpecificationSchema).optional().default([]),
  amenities: z.array(AmenitySchema).optional().default([]),

  nearbyPlaces: z.array(NearbyPlaceSchema).optional().default([]),
  leads: z.array(LeadSchema).optional().default([]),

  legalChecks: LegalChecksSchema.optional().default({
    approvals: [],
    approvalsFiles: [],
    taxReceipts: [],
    litigation: { hasLitigation: false, documents: [] },
  }),

  isFeatured: z.boolean().optional().default(false),
  rank: z.number().int().optional().default(1),

  meta: z
    .object({
      views: z.number().int().nonnegative().optional().default(0),
      inquiries: z.number().int().nonnegative().optional().default(0),
      clicks: z.number().int().nonnegative().optional().default(0),
    })
    .optional()
    .default({ views: 0, inquiries: 0, clicks: 0 }),

  status: z
    .enum(["active", "inactive", "archived"])
    .optional()
    .default("active"),

  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  relatedProjects: z.array(z.string()).optional().default([]),
});
export type BaseCreate = z.infer<typeof BaseCreateSchema>;

/* ---------- Shared filter/query schema ---------- */
export const PropertyListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
  q: z.string().optional(),
  city: z.string().optional(),
  listingSource: z.string().optional(),
  listingType: z.enum(["sale", "rent", "lease"]).optional(),
  sort: z.string().optional(),
  near: z.string().optional(),
  maxDistance: z.coerce.number().optional(),
  subCategory: z.string().optional(),
});
export type PropertyListQuery = z.infer<typeof PropertyListQuerySchema>;
