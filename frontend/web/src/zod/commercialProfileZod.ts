import { z } from "zod";

export const commercialProfileSchema = z.object({
  amenities: z.array(z.string()).optional(),

  parkingDetails: z
    .object({
      twoWheeler: z.number().min(0),
      fourWheeler: z.number().min(0),
    })
    .optional(),

  flooringType: z.string().optional(),

  floorNumber: z.number().min(0).optional(),
  totalFloors: z.number().min(0).optional(),

  pantry: z
    .object({
      type: z.string().optional(),
      insidePremises: z.boolean().optional(),
      shared: z.boolean().optional(),
    })
    .optional(),

  propertyAge: z.string().optional(),

  buildingManagement: z
    .object({
      managedBy: z.string().optional(),
      contact: z.string().optional(),
    })
    .optional(),

  zoning: z.string().optional(),

  fireSafety: z.boolean().optional(),

  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description too long")
    .optional(),
});

export const validateCommercialProfile = (commercial: any) => {
  return commercialProfileSchema.safeParse(commercial);
};
