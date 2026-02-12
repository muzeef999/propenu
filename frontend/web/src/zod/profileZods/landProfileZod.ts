import { z } from "zod";

/**
 * Reusable enums
 */
export const FacingEnum = z.enum([
  "East",
  "West",
  "North",
  "South",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
]);

export const LayoutTypeEnum = z.enum([
  "approved-layout",
  "unapproved-layout",
  "gated-layout",
  "individual-plot",
]);

export const landProfileSchema = z.object({
 layoutType: z.preprocess(
  (val) => val ?? "",
  z
    .string()
    .nonempty("Please select one option")
    .pipe(LayoutTypeEnum)
),


  facing: FacingEnum.optional(),

  amenities: z.array(z.string()).optional(),

  surveyNumber: z.string().max(50, "Survey number is too long").optional(),

  landUseZone: z.string().max(100, "Land use zone is too long").optional(),

  // Plot Features & Utilities
  readyToConstruct: z.boolean().optional(),
  waterConnection: z.boolean().optional(),
  electricityConnection: z.boolean().optional(),
  cornerPlot: z.boolean().optional(),
  fencing: z.boolean().optional(),

  // Pricing
  isPriceNegotiable: z.boolean().default(false),

   description: z.preprocess(
  (val) => val ?? "",
  z
    .string()
    .nonempty("Description is required")
    .min(30, "Description must be at least 30 characters long")
),

  images: z.array(z.instanceof(File)).default([]),
})

/**
 * Useful inferred type
 */
export const validateLandProfile = (
  land: any,
  files: File[],
  serverImageCount = 0,
) => {
  return landProfileSchema.safeParse({
    ...land,
    images: files,
  });
};
