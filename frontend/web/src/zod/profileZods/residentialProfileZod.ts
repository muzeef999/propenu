import { z } from "zod";
import { hasBlockedContentInDescription } from "@/utilies/stripPhoneFromDescription";

export const residentialProfileSchema = z
  .object({
   amenities: z
  .array(
    z.union([
      z.string(),
      z.object({
        title: z.string().min(1),
      }),
    ]),
  )
  .transform((arr) =>
    arr.map((a) => (typeof a === "string" ? a : a.title)),
  ),

  parkingType: z.enum(["open", "closed", "both"]).optional(),

  parkingDetails: z
    .object({
      twoWheeler: z.number().min(0, "Cannot be negative"),
      fourWheeler: z.number().min(0, "Cannot be negative"),
    })
    .optional(),

  flooringType: z
    .enum([
      "vitrified",
      "marble",
      "granite",
      "wooden",
      "ceramic-tiles",
      "mosaic",
      "normal-tiles",
      "cement",
      "other",
    ])
    .optional(),

  floorNumber: z.number().min(0, "Floor number cannot be negative").optional(),
  totalFloors: z.number().min(0, "Total floors cannot be negative").optional(),

  kitchenType: z
    .enum(["open", "closed", "semi-open", "island", "parallel", "u-shaped", "l-shaped"])
    .optional(),
  isModularKitchen: z.boolean().optional(), 

  isPriceNegotiable: z.boolean().optional(),

  listingType: z.enum(["sale", "rent"]).optional(),

  description: z
    .string({
      message: "Description is atleast 30 characters long",
    }),

    
    images: z.array(z.instanceof(File)).default([]),
  })
  .superRefine((data, ctx) => {
    const floorNumber = data.floorNumber ?? 0;
    const totalFloors = data.totalFloors ?? 0;

    if (floorNumber > totalFloors) {
      ctx.addIssue({
        path: ["floorNumber"],
        code: z.ZodIssueCode.custom,
        message: "Floor number cannot be greater than total floors",
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
  });



export const validateResidentialProfile = (
  residential: any,
  files: File[],
) => {
  return residentialProfileSchema.safeParse({
    ...residential,
    images: files,
  });
};
