import { z } from "zod";
import {
  RESIDENTIAL_PROPERTY_KEYS,
  COMMERCIAL_PROPERTY_KEYS,
  PROJECT_PROPERTY_KEYS,
} from "@/app/(pages)/postproperty/constants/subTypes";

export const basicDetailsSchema = z
  .object({
    /* ---------------- BASE ---------------- */
    listingType: z.enum(["sale", "rent"], {
      message: "Listing type is required",
    }),

    category: z.enum(["residential", "commercial", "land", "agricultural", "project"], {
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
    projectArea: z.union([z.string(), z.number()]).optional(),
    totalTowers: z.union([z.string(), z.number()]).optional(),
    totalUnits: z.union([z.string(), z.number()]).optional(),
    availableUnits: z.union([z.string(), z.number()]).optional(),
    totalArea: z.any().optional(),
    roadWidthFt: z.union([z.string(), z.number()]).optional(),
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
    furnishedStatus: z.string().optional(),
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
      facing,
      constructionStatus,
      propertyAge,
      price,
      carpetArea,
      builtUpArea,
      plotArea,
      totalArea,
      commercialSubType,
      cabins,
      seats,
    } = data;
    const isProjectResidential =
      category === "project" &&
      (propertyType === "apartment" || propertyType === "villa");
    const isProjectLand =
      category === "project" &&
      (propertyType === "open-plot" || propertyType === "commercial-plot");
    const isProjectCommercial =
      category === "project" && propertyType === "commercial-space";

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

    /* ================= RESIDENTIAL COUNTERS ================= */
    if ((category === "residential" && propertyType) || isProjectResidential) {
      if (data.bedrooms == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bedrooms"],
          message: "Please select number of bedrooms",
        });
      }

      if (data.bathrooms == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bathrooms"],
          message: "Please select number of bathrooms",
        });
      }
    }

    /* ================= FURNISHING ================= */
    if (
      ((category === "residential" && propertyType) || isProjectResidential) &&
      !data.furnishing
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["furnishing"],
        message: "Please select furnishing",
      });
    }

    if (category === "commercial" || isProjectCommercial) {
      const needsFurnishing = Number(cabins) > 0 || Number(seats) > 0;
      const selectedFurnishing = data.furnishedStatus ?? data.furnishing;

      if (needsFurnishing && !selectedFurnishing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["furnishedStatus"],
          message: "Please select furnishing",
        });
      }
    }

    /* ================= FACING ================= */
    if (
      ((category === "residential" && propertyType) || isProjectResidential) &&
      !facing
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["facing"],
        message: "Please select facing",
      });
    }

    if (category === "project" && !propertyType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyType"],
        message: "Please select a project sub-type",
      });
    }

    if ((category === "commercial" || isProjectCommercial) && propertyType && !facing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["facing"],
        message: "Please select facing",
      });
    }

    /* ================= LAND ================= */
    if ((category === "land" || isProjectLand) && !data.landSubType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["landSubType"],
        message: "Land sub-type is required",
      });
    }

    /* ================= LAND DIMENSIONS ================= */
    if ((category === "land" || isProjectLand) && data.dimensions) {
      const length = Number(data.dimensions.length);
      const width = Number(data.dimensions.width);

      const hasLength = data.dimensions.length != null;
      const hasWidth = data.dimensions.width != null;

      if ((hasLength && !hasWidth) || (!hasLength && hasWidth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dimensions"],
          message: "Please enter both length and width",
        });
      }

      if ((hasLength && length <= 0) || (hasWidth && width <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dimensions"],
          message: "Length and width must be greater than 0",
        });
      }
    }

    /* ================= AGRICULTURAL ================= */
    if (category === "agricultural" && !data.agriculturalSubType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["agriculturalSubType"],
        message: "Agricultural sub-type is required",
      });
    }

    /* ================= VALID PROPERTY TYPES ================= */
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

    if (
      category === "project" &&
      propertyType &&
      !PROJECT_PROPERTY_KEYS.includes(
        propertyType as (typeof PROJECT_PROPERTY_KEYS)[number],
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyType"],
        message: "Invalid project property type",
      });
    }

    /* ================= PRICING ================= */
    if (
      category === "residential" ||
      category === "commercial" ||
      isProjectResidential ||
      isProjectCommercial
    ) {
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

      if (!builtUpArea || Number(builtUpArea) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["builtUpArea"],
          message: "Built-up area is required",
        });
      }

      if (
        carpetArea &&
        builtUpArea &&
        Number(carpetArea) > 0 &&
        Number(builtUpArea) > 0 &&
        Number(builtUpArea) < Number(carpetArea)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["builtUpArea"],
          message: "Built-up area cannot be less than carpet area",
        });
      }
    }

    if (category === "land" || isProjectLand) {
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

    if (category === "agricultural" && !totalArea) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalArea"],
        message: "Total area is required",
      });
    }

    /* ================= AVAILABILITY ================= */
    if (
      ((category === "residential" || isProjectResidential) && facing) ||
      ((category === "commercial" || isProjectCommercial) &&
        facing &&
        data.wallFinishStatus)
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
      (category === "residential" || isProjectResidential) &&
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
      (category === "residential" ||
        category === "commercial" ||
        isProjectResidential ||
        isProjectCommercial) &&
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
    if (category === "commercial" || isProjectCommercial) {
      if (category === "commercial" && !commercialSubType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["commercialSubType"],
          message: "Please select a commercial sub-type",
        });
      }

      if (
        (category === "commercial" ? commercialSubType : true) &&
        !data.wallFinishStatus
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["wallFinishStatus"],
          message: "Please select wall finish",
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
