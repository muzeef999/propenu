import { z } from "zod";
import {
  RESIDENTIAL_PROPERTY_KEYS,
  COMMERCIAL_PROPERTY_KEYS,
} from "@/app/(pages)/postproperty/constants/subTypes";

export const basicDetailsSchema = z
  .object({
    listingType: z.enum(["buy", "rent", "lease"], {
      message: "Listing type is required",
    }),

    category: z.enum(["residential", "commercial", "land", "agricultural"], {
      message: "Category is required",
    }),

    propertyType: z.string().min(1, "Property type is required").optional(),

    images: z.array(z.instanceof(File)).min(5, "Upload at least 5 images"),
  })
  .superRefine((data, ctx) => {
    const { category, propertyType } = data;

    // For residential and commercial, propertyType is REQUIRED
    if ((category === "residential" || category === "commercial") && !propertyType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please select a valid ${category} property type`,
        path: ["propertyType"],
      });
      return;
    }

    if (category === "residential") {
      if (
        !RESIDENTIAL_PROPERTY_KEYS.includes(
          propertyType as (typeof RESIDENTIAL_PROPERTY_KEYS)[number]
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid residential property type",
          path: ["propertyType"],
        });
      }
    }

    if (category === "commercial") {
      if (
        !COMMERCIAL_PROPERTY_KEYS.includes(
          propertyType as (typeof COMMERCIAL_PROPERTY_KEYS)[number]
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid commercial property type",
          path: ["propertyType"],
        });
      }
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

