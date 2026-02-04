import { z } from "zod";
import {
  RESIDENTIAL_PROPERTY_KEYS,
  COMMERCIAL_PROPERTY_KEYS,
} from "@/app/(pages)/postproperty/constants/subTypes";

export const basicDetailsSchema = z
  .object({
    /* ---------------- BASE ---------------- */
    listingType: z.enum(["sale", "rent"], {
      message: "Listing type is required",
    }),

    category: z.enum(["residential", "commercial", "land", "agricultural"], {
      message: "Property type is required",
    }),

    propertyType: z.string().optional(),

    /* ---------------- COMMERCIAL ---------------- */
    commercialSubType: z.string().optional(),
    cabins: z.union([z.string(), z.number()]).optional(),
    seats: z.union([z.string(), z.number()]).optional(),

    wallFinishStatus: z.string().optional(),

    landSubType: z.string().optional(),
    agriculturalSubType: z.string().optional(),

    /* ---------------- PRICING ---------------- */
    price: z.union([z.string(), z.number()]).optional(),

    carpetArea: z.union([z.string(), z.number()]).optional(),
    builtUpArea: z.union([z.string(), z.number()]).optional(),

    plotArea: z.union([z.string(), z.number()]).optional(),
    totalArea: z.any().optional(),
    roadWidth: z.any().optional(),

    dimensions: z
      .object({
        length: z.union([z.string(), z.number()]).optional(),
        width: z.union([z.string(), z.number()]).optional(),
      })
      .optional(),

    /* ---------------- RESIDENTIAL ---------------- */
    bedrooms: z.union([z.string(), z.number()]).optional(),
    bathrooms: z.union([z.string(), z.number()]).optional(),
    balconies: z.union([z.string(), z.number()]).optional(),

    furnishing: z.string().optional(),
    facing: z.string().optional(),

    /* ---------------- STATUS ---------------- */
    constructionStatus: z.string().optional(),
    propertyAge: z.union([z.string(), z.number()]).optional(),
    possessionDate: z.string().optional(),

    transactionType: z.string().optional(),

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
      plotArea,
      totalArea,
      commercialSubType,
      cabins,
      seats,
    } = data;

    /* ================= PROPERTY TYPE ================= */
    if (
      (category === "residential" || category === "commercial") &&
      !propertyType
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyType"],
        message: "Please select a property sub-type",
      });
    }
    /* ================= LAND ================= */
    if (category === "land" && !data.landSubType) {
      ctx.addIssue({
        path: ["landSubType"],
        code: z.ZodIssueCode.custom,
        message: "Land sub-type is required",
      });
    }
    /* ================= LAND DIMENSIONS (OPTIONAL) ================= */
    if (category === "land" && data.dimensions) {
      const length = Number(data.dimensions.length);
      const width = Number(data.dimensions.width);

      const hasLength = !!data.dimensions.length;
      const hasWidth = !!data.dimensions.width;

      // If one is filled, both are required
      if ((hasLength && !hasWidth) || (!hasLength && hasWidth)) {
        ctx.addIssue({
          path: ["dimensions"],
          code: z.ZodIssueCode.custom,
          message: "Please enter both length and width",
        });
      }

      // If provided, must be positive numbers
      if ((hasLength && length <= 0) || (hasWidth && width <= 0)) {
        ctx.addIssue({
          path: ["dimensions"],
          code: z.ZodIssueCode.custom,
          message: "Length and width must be greater than 0",
        });
      }
    }

    /* ================= AGRICULTURAL ================= */
    if (category === "agricultural" && !data.agriculturalSubType) {
      ctx.addIssue({
        path: ["agriculturalSubType"],
        code: z.ZodIssueCode.custom,
        message: "Agricultural sub-type is required",
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
        message: "Invalid residential property type",
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
        message: "Invalid commercial property type",
      });
    }

    /* ================= FURNISHING ================= */
    if (category === "residential") {
      const needsFurnishing = data.bedrooms || data.bathrooms || data.balconies;

      if (needsFurnishing && !data.furnishing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["furnishing"],
          message: "Please select furnishing",
        });
      }
    }

    if (category === "commercial") {
      const needsFurnishing = Number(cabins) > 0 || Number(seats) > 0;

      if (needsFurnishing && !data.furnishing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["furnishing"],
          message: "Please select furnishing",
        });
      }
    }

    /* ================= PRICING ================= */
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

    if (category === "land") {
      if (!price || Number(price) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["price"],
          message: "Total price is required",
        });
      }

      if (!plotArea || Number(plotArea) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["plotArea"],
          message: "Plot area is required",
        });
      }
    }
    if (category === "agricultural" && !data.totalArea) {
      ctx.addIssue({
        path: ["totalArea"],
        code: z.ZodIssueCode.custom,
        message: "Total area is required",
      });
    }

    /* ================= AVAILABILITY ================= */
    if (
      (category === "residential" && data.facing) ||
      (category === "commercial" && data.wallFinishStatus)
    ) {
      if (!constructionStatus) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["constructionStatus"],
          message: "Please select availability status",
        });
      }
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

    /* ================= TRANSACTION TYPE ================= */
    if (
      (category === "residential" || category === "commercial") &&
      constructionStatus &&
      !data.transactionType
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transactionType"],
        message: "Please select transaction type",
      });
    }

    /* ================= COMMERCIAL EXTRA ================= */
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

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["seats"],
          message: "Enter number of cabins or seats",
        });
      }
    }
  });

/* ================= TYPES ================= */
export type BasicDetailsForm = z.infer<typeof basicDetailsSchema>;

/* ================= VALIDATOR ================= */
export const validateBasicDetails = (data: any, category: string) => {
  return basicDetailsSchema.safeParse({
    ...data,
    category,
  });
};
