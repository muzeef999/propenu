// src/zod/validation.ts
import { z } from "zod";

export const UnitZ = z.object({
  minSqft: z.number().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  availableCount: z.number().int().nonnegative().optional().default(0),
  plan: z
    .object({
      url: z.string().optional(),
      key: z.string().optional(),
      filename: z.string().optional(),
      mimetype: z.string().optional(),
    })
    .optional(),
});

export const BhkSummarySchemaZ = z.object({
  bhk: z.number().int().nonnegative(),
  bhkLabel: z.string().optional(),
  units: z.array(UnitZ).default([]),
});


export const AboutSummaryZ = z.object({
  aboutDescription: z.string().optional(),
  url: z.string().url("Invalid URL format").optional(),
  rightContent: z.string().min(1, "Right content is required"),
});


const GallerySummarySchema = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  category: z.string().optional(),
  order: z.number().int().optional(),
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
  items: z.array(SpecificationItemSchema).optional().default([]),
  order: z.number().int().optional().default(0),
});

const NearbyPlaceSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  distanceText: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(), // [lng, lat]
  order: z.number().int().optional().default(0),
});

const LeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  location: z.string().optional(),
  message: z.string().max(2000).optional(),
  createdAt: z.string().optional(), // accept ISO date strings, service can parse
});

export const CreateFeaturePropertySchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  developer: z.string().optional(),

  featuredTagline: z.string().optional(),
  address: z.string().min(1),
  city: z.string().optional(),
  location: z
    .object({
      type: z.literal("Point").optional().default("Point"),
      coordinates: z.tuple([z.number(), z.number()]).optional(),
    })
    .optional(),

  mapEmbedUrl: z.string().url().optional(),

  currency: z.string().optional().default("INR"),
  // priceFrom/priceTo not required — computed
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  bhkSummary: z.array(BhkSummarySchemaZ).optional().default([]),

 
  aboutSummary: z
  .union([AboutSummaryZ, z.array(AboutSummaryZ)])
  .optional()
  .transform((val) => {
    // normalize to array for downstream code: undefined -> []
    if (typeof val === "undefined") return [];
    return Array.isArray(val) ? val : [val];
  }),

  sqftRange: z
    .object({ min: z.number().optional(), max: z.number().optional() })
    .optional(),
  possessionDate: z.string().optional(),

  totalTowers: z.number().int().optional(),
  totalFloors: z.string().optional(),
  projectArea: z.number().optional(),
  totalUnits: z.number().int().optional(),
  availableUnits: z.number().int().optional(),

  reraNumber: z.string().optional(),
  banksApproved: z.array(z.string()).optional().default([]),

  heroImage: z.string().url().optional(),
  heroVideo: z.string().url().optional(),
  heroTagline: z.string().optional(),
  heroSubTagline: z.string().optional(),
  heroDescription: z.string().optional(),


  // / SEO / branding - added
  color: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),

  gallery: z.array(z.string()).optional().default([]),
  gallerySummary: z.array(GallerySummarySchema).optional().default([]),

  brochureUrl: z.string().url().optional(),
  brochureFileName: z.string().optional(),

  specifications: z.array(SpecificationSchema).optional().default([]),
  amenities: z.array(AmenitySchema).optional().default([]),

  nearbyPlaces: z.array(NearbyPlaceSchema).optional().default([]),

  // leads array — only useful for embedded leads (small volume)
  leads: z.array(LeadSchema).optional().default([]),

  isFeatured: z.boolean().optional().default(false),
  rank: z.number().int().optional().default(1),

  meta: z
    .object({
      views: z.number().int().optional().default(0),
      inquiries: z.number().int().optional().default(0),
      clicks: z.number().int().optional().default(0),
    })
    .optional()
    .default(() => ({ views: 0, inquiries: 0, clicks: 0 } as const)),


  status: z.enum(["active", "inactive", "archived"]).optional().default("active"),

  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const UpdateFeaturePropertySchema = CreateFeaturePropertySchema.partial();

export type CreateFeaturePropertyDTO = z.infer<typeof CreateFeaturePropertySchema>;
export type UpdateFeaturePropertyDTO = z.infer<typeof UpdateFeaturePropertySchema>;
