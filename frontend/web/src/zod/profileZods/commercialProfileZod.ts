import { z } from "zod";
import { hasBlockedContentInDescription } from "@/utilies/stripPhoneFromDescription";

export const commercialProfileSchema = z.object({
  amenities: z.array(z.string()).optional(),

  parkingDetails: z
    .preprocess(
      (value) => {
        if (!value || typeof value !== "object") return undefined;

        const parking = value as {
          twoWheeler?: number;
          fourWheeler?: number;
        };

        return {
          twoWheeler: parking.twoWheeler ?? 0,
          fourWheeler: parking.fourWheeler ?? 0,
        };
      },
      z.object({
        twoWheeler: z.number().min(0),
        fourWheeler: z.number().min(0),
      }),
    )
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

  fireSafety: z
    .object({
      fireExtinguisher: z.boolean().optional(),
      fireSprinklerSystem: z.boolean().optional(),
      fireHoseReel: z.boolean().optional(),
      fireHydrant: z.boolean().optional(),
      smokeDetector: z.boolean().optional(),
      fireAlarmSystem: z.boolean().optional(),
      fireControlPanel: z.boolean().optional(),
      emergencyExitSignage: z.boolean().optional(),
    })
    .refine(
      (obj) => Object.values(obj || {}).some(Boolean),
      { message: "Select at least one fire safety measure" }
    )
    .optional(),

  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description too long")
    .optional(),
  images: z.array(z.instanceof(File)).default([]),
}).superRefine((data, ctx) => {
  if (hasBlockedContentInDescription(data.description || "")) {
    ctx.addIssue({
      path: ["description"],
      code: z.ZodIssueCode.custom,
      message:
        "Phone numbers, emails, and house addresses are not allowed in the description",
    });
  }
});


export const validateCommercialProfile = (
  commercial: any,
  files: File[] = [],
) => {
  return commercialProfileSchema.safeParse({
    ...commercial,
    images: files,
  });
};
