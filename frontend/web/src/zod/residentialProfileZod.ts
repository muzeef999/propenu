import { z } from "zod";

export const residentialProfileSchema = z.object({
  amenities: z.array(z.string()).optional(),

  parkingType: z.string().optional(),

  parkingDetails: z
    .object({
      twoWheeler: z.number().min(0),
      fourWheeler: z.number().min(0),
    })
    .optional(),

  flooringType: z.string().optional(),

  floorNumber: z.number().min(0).optional(),
  totalFloors: z.number().min(0).optional(),

  kitchenType: z.string().optional(),
  isModularKitchen: z.boolean().optional(),

  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description too long"),

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
