import { z } from "zod";
import {
  RESIDENTIAL_PROPERTY_KEYS,
  COMMERCIAL_PROPERTY_KEYS,
} from "@/app/(pages)/postproperty/constants/subTypes";

export const basicDetailsSchema = z
  .object({
    listingType: z.enum(["sale", "rent", "lease"], {
      message: "Listing type is required",
    }),

    category: z.enum(["residential", "commercial", "land", "agricultural"], {
      message: "Property type is required",
    }),

    propertyType: z.string({
      message: "Please select a property Sub-type",
    }),

    commercialSubType: z.string().optional(),
    cabins: z.union([z.string(), z.number()]).optional(),
    seats: z.union([z.string(), z.number()]).optional(),

    wallFinishStatus: z.string().optional(),

    carpetArea: z.union([z.string(), z.number()]).optional(),

    builtUpArea: z.union([z.string(), z.number()]).optional(),

    price: z.union([z.string(), z.number()]).optional(),

    bedrooms: z.union([z.string(), z.number()]).optional(),

    bathrooms: z.union([z.string(), z.number()]).optional(),

    balconies: z.union([z.string(), z.number()]).optional(),

    furnishing: z.string().optional(),

    facing: z.string().optional(),

    propertyAge: z.union([z.string(), z.number()]).optional(),

    possessionDate: z.string().optional(),

    constructionStatus: z.string({
      message: "Availability status is required",
    }),

    transactionType: z.string({
      message: "Transaction type is required",
    }),

    // images: z
    //   .array(z.instanceof(File))
    //   .min(5, "Upload at least 5 images"),
    images: z.array(z.instanceof(File)).optional(),
  })
  .superRefine((data, ctx) => {
    const {
      category,
      propertyType,
      constructionStatus,
      propertyAge,
      price,
      carpetArea,
      commercialSubType,
      cabins,
      seats,
    } = data;

    /* ---------------- PROPERTY TYPE ---------------- */
    if (
      (category === "residential" || category === "commercial") &&
      !propertyType
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyType"],
        message: `Please select a valid ${category} property type`,
      });
    }

    if (
      category === "residential" &&
      propertyType &&
      !RESIDENTIAL_PROPERTY_KEYS.includes(
        propertyType as (typeof RESIDENTIAL_PROPERTY_KEYS)[number],
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
        propertyType as (typeof COMMERCIAL_PROPERTY_KEYS)[number],
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyType"],
        message: "Please select a valid commercial property type",
      });
    }

    /* ---------------- AVAILABILITY STATUS ---------------- */
    const needsAvailabilityStatus =
      category === "residential" || category === "commercial";

    if (
      needsAvailabilityStatus &&
      (!constructionStatus || constructionStatus.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["constructionStatus"],
        message: "Please select availability status",
      });
    }

    if (
      category === "residential" &&
      constructionStatus === "ready-to-move" &&
      !propertyAge
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyAge"],
        message: "Please select property age",
      });
    }

    /* ---------------- PRICING ---------------- */
    if (category === "residential" || category === "commercial") {
      if (!price || Number(price) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["price"],
          message: "Total price is required",
        });
      }

      if (!carpetArea || Number(carpetArea) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["carpetArea"],
          message: "Carpet area is required",
        });
      }
    }

    /* ---------------- COMMERCIAL ---------------- */
    if (category === "commercial") {
      if (!commercialSubType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["commercialSubType"],
          message: "Please select a commercial sub-type",
        });
      }

      if (
        (!cabins || Number(cabins) === 0) &&
        (!seats || Number(seats) === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cabins"],
          message: "Enter number of cabins or seats",
        });
      }
    }
  });

export type BasicDetailsForm = z.infer<typeof basicDetailsSchema>;

export const validateBasicDetails = (data: any, category: string) => {
  return basicDetailsSchema.safeParse({
    ...data,
    category,
  });
};
