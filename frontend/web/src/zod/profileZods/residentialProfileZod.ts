import { z } from "zod";

export const residentialProfileSchema = z.object({
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

  images: z
    .array(z.instanceof(File))
    .min(5, "Upload at least 5 images"),
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
