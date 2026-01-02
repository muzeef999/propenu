import { z } from "zod";
import {
  RESIDENTIAL_PROPERTY_KEYS,
  COMMERCIAL_PROPERTY_KEYS,
} from "@/app/(pages)/postproperty/constants/subTypes";

export const basicDetailsSchema = z
  .object({
    listingType: z.enum(["buy", "rent", "lease"], {
      message: "Category is required",
    }),

    category: z.enum(
      ["residential", "commercial", "land", "agricultural"],
      {
        message: "Category is required",
      }
    ),

    propertyType: z.string().optional(),

    carpetArea: z
      .coerce.number()
      .min(100, "Carpet area must be at least 100 sqft")
      .max(5000, "Carpet area must be at most 5000 sqft")
      .optional(),

    builtUpArea: z
      .coerce.number()
      .min(100, "Built-up area must be at least 100 sqft")
      .max(5000, "Built-up area must be at most 5000 sqft")
      .optional(),

    images: z
      .array(z.instanceof(File))
      .min(5, "Upload at least 5 images"),
  })
  .superRefine((data, ctx) => {
    const { category, propertyType } = data;

    // 🔒 propertyType required for residential & commercial
    if (
      (category === "residential" || category === "commercial") &&
      !propertyType
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyType"],
        message: `Please select a valid ${category} property type`,
      });
      return;
    }

    if (
      category === "residential" &&
      propertyType &&
      !RESIDENTIAL_PROPERTY_KEYS.includes(
        propertyType as (typeof RESIDENTIAL_PROPERTY_KEYS)[number]
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyType"],
        message: "Please select a valid residential property type",
      });
    }

    if (
      category === "commercial" &&
      propertyType &&
      !COMMERCIAL_PROPERTY_KEYS.includes(
        propertyType as (typeof COMMERCIAL_PROPERTY_KEYS)[number]
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyType"],
        message: "Please select a valid commercial property type",
      });
    }
  });

export type BasicDetailsForm = z.infer<typeof basicDetailsSchema>;


export const validateBasicDetails = (
  base: any,
  category: string,
  files: { file: File }[]
) => {
  return basicDetailsSchema.safeParse({
    listingType: base.listingType,
    category,
    propertyType: base.propertyType, // ✔ correct
    images: files.map((f) => f.file),
  });
};

