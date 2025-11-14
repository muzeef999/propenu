import { z } from "zod";

const BhkSummarySchema = z.object({
  bhk: z.number(),
  bhkLabel: z.string().optional(),
  minSqft: z.number().optional(),
  maxSqft: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  availableCount: z.number().optional(),
});

const GallerySummarySchema = z.object({
  title: z.string().optional(),
  url: z.string(),
  category: z.string().optional(),
  order: z.number().optional()
});

const AmenitySchema = z.object({
  key: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional()
});

const SpecificationItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional()
});

const SpecificationSchema = z.object({
  category: z.string().optional(),
  items: z.array(SpecificationItemSchema).optional(),
  order: z.number().optional()
});

const NearbyPlaceSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  distanceText: z.string().optional(),
  coordinates: z.array(z.number()).optional(),
  order: z.number().optional()
});

export const CreateFeaturePropertySchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  developer: z.string().optional(),
  about: z.string().optional(),
  featuredTagline: z.string().optional(),

  address: z.string().min(1),
  city: z.string().optional(),
  location: z
    .object({
      type: z.literal("Point").optional().default("Point"),
      coordinates: z.array(z.number()).length(2).optional(),
    })
    .optional(),

  mapEmbedUrl: z.string().optional(),

  currency: z.string().optional().default("INR"),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  bhkSummary: z.array(BhkSummarySchema).optional(),

  sqftRange: z
    .object({ min: z.number().optional(), max: z.number().optional() })
    .optional(),
  possessionDate: z.string().optional(),

  totalTowers: z.number().optional(),
  totalFloors: z.string().optional(),
  projectArea: z.number().optional(),
  totalUnits: z.number().optional(),
  availableUnits: z.number().optional(),

  reraNumber: z.string().optional(),
  banksApproved: z.array(z.string()).optional(),

  heroImage: z.string().optional(),
  heroVideo: z.string().optional(),
  gallery: z.array(z.string()).optional(), // store ids for gallery refs
  gallerySummary: z.array(GallerySummarySchema).optional(),

  brochureUrl: z.string().optional(),
  brochureFileName: z.string().optional(),

  specifications: z.array(SpecificationSchema).optional(),
  amenities: z.array(AmenitySchema).optional(),

  nearbyPlaces: z.array(NearbyPlaceSchema).optional(),

  isFeatured: z.boolean().optional(),
  rank: z.number().optional(),

  meta: z
    .object({
      views: z.number().optional(),
      inquiries: z.number().optional(),
      clicks: z.number().optional(),
    })
    .optional(),

  status: z.enum(["active", "inactive", "archived"]).optional(),

  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const UpdateFeaturePropertySchema = CreateFeaturePropertySchema.partial();

export type CreateFeaturePropertyDTO = z.infer<typeof CreateFeaturePropertySchema>;
export type UpdateFeaturePropertyDTO = z.infer<typeof UpdateFeaturePropertySchema>;
