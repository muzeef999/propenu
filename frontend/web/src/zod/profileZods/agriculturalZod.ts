import { z } from "zod";
import { hasBlockedContentInDescription } from "@/utilies/stripPhoneFromDescription";

/* ---------------- Reusable Schemas ---------------- */

const borewellDetailsSchema = z.object({
  depthMeters: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : Number(val)),
    z.number().min(1, "Depth must be greater than 0")
  ),

  yieldLpm: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : Number(val)),
    z.number().min(1, "Yield must be greater than 0")
  ),

  drilledYear: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : Number(val)),
    z
      .number()
      .min(1900, "Invalid year")
      .max(new Date().getFullYear(), "Invalid year")
  ),
});


/* ---------------- Agricultural Schema ---------------- */

export const agriculturalSchema = z
  .object({
    plantationAge: z.number().min(0).optional(),

    /* ===== SOIL & WATER ===== */
    soilType: z.string().optional(),
    irrigationType: z.string().optional(),
    waterSource: z.string().optional(),

    /* ===== BOREWELL ===== */
    numberOfBorewells: z.number().min(0).optional(),
    borewellDetails: borewellDetailsSchema.optional(),

    /* ===== CROP ===== */
    currentCrop: z.string().optional(),
    suitableFor: z.string().optional(),
    landShape: z.string().optional(),

    /* ===== LEGAL & ACCESS ===== */
    statePurchaseRestrictions: z.string().optional(),
    accessRoadType: z.string().optional(),

    /* ===== FEATURES ===== */
    boundaryWall: z.boolean().optional(),
    electricityConnection: z.boolean().optional(),

    /* ===== PRICE ===== */
    isPriceNegotiable: z.boolean().optional(),


    /* ===== DESCRIPTION ===== */
    description: z.preprocess(
  (val) => val ?? "",
  z
    .string()
    .nonempty("Description is required")
    .min(30, "Description must be at least 30 characters long")
),

    /* ===== IMAGES (handled separately) ===== */
     images: z.array(z.instanceof(File)).default([]),

  })
  .superRefine((data, ctx) => {
    if (!data.accessRoadType) {
      ctx.addIssue({
        path: ["accessRoadType"],
        code: z.ZodIssueCode.custom,
        message: "Access road type is required",
      });
    }
    if (!data.statePurchaseRestrictions) {
      ctx.addIssue({
        path: ["statePurchaseRestrictions"],
        code: z.ZodIssueCode.custom,
        message: "Select Applicable or Not Applicable",
      });
    } else if (
      data.statePurchaseRestrictions !== "Applicable" &&
      data.statePurchaseRestrictions !== "Not Applicable"
    ) {
      ctx.addIssue({
        path: ["statePurchaseRestrictions"],
        code: z.ZodIssueCode.custom,
        message: "Select Applicable or Not Applicable",
      });
    }

    if (!data.images || data.images.length === 0) {
      ctx.addIssue({
        path: ["images"],
        code: z.ZodIssueCode.custom,
        message: "Upload at least 5 images",
      });
    }

    if (hasBlockedContentInDescription(data.description || "")) {
      ctx.addIssue({
        path: ["description"],
        code: z.ZodIssueCode.custom,
        message:
          "Phone numbers, emails, and house addresses are not allowed in the description",
      });
    }

    // ✅ Purchase restriction optional BUT min length if filled

    /* ================= BOREWELL CONDITIONAL ================= */
    if (
      data.waterSource === "bore-well" &&
      (data.numberOfBorewells ?? 0) > 0 &&
      !data.borewellDetails
    ) {
      ctx.addIssue({
        path: ["borewellDetails"],
        code: z.ZodIssueCode.custom,
        message: "Borewell details are required",
      });
    }
  });

/* ---------------- Types ---------------- */

export type AgriculturalForm = z.infer<typeof agriculturalSchema>;

/* ---------------- Validator ---------------- */

export const validateAgriculturalProfile = (
  agricultural: any,
  files: File[],
) => {
  return agriculturalSchema.safeParse({
    ...agricultural,
    images: files,
  });
};
