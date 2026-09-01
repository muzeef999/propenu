import { z } from "zod";

const textField = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine(
      (value) => /[a-zA-Z]/.test(value),
      `${label} must contain valid text`,
    );

const optionalNameField = (label: string) =>
  z
    .string()
    .trim()
    .max(120, `${label} must be at most 120 characters`)
    .refine(
      (value) => value === "" || /[a-zA-Z]/.test(value),
      `${label} must contain valid text`,
    )
    .optional()
    .default("");

/* ---------------- Nearby Place Schema ---------------- */

const nearbyPlaceSchema = z.object({
  name: z.string().min(1, "Place name is required"),
  type: z.string().optional(),
  distanceText: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  order: z.number().optional(),
});

/* ---------------- Location Schema ---------------- */

export const locationDetailsSchema = z
  .object({
    address: z
      .string()
      .trim()
      .min(10, "Address must be at least 10 characters")
      .max(500, "Address must be at most 500 characters")
      .refine(
        (value) => /[a-zA-Z]/.test(value),
        "Address must contain valid text",
      ),

    locality: textField("Locality", 2, 80),

    city: textField("City", 2, 80),

    state: textField("State", 2, 80),

    pincode: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d{6}$/.test(value), {
        message: "Pincode must be exactly 6 digits",
      })
      .optional()
      .default(""),

    buildingName: optionalNameField("Building name"),
    landName: optionalNameField("Land name"),

    location: z.object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    }),

    nearbyPlaces: z.array(nearbyPlaceSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const buildingName = data.buildingName?.trim() ?? "";
    const landName = data.landName?.trim() ?? "";

    if (!buildingName && !landName) {
      ctx.addIssue({
        path: ["buildingName"],
        code: z.ZodIssueCode.custom,
        message: "Building or land name is required",
      });
    }

    if (buildingName && buildingName.length < 2) {
      ctx.addIssue({
        path: ["buildingName"],
        code: z.ZodIssueCode.custom,
        message: "Building name must be at least 2 characters",
      });
    }

    if (landName && landName.length < 2) {
      ctx.addIssue({
        path: ["landName"],
        code: z.ZodIssueCode.custom,
        message: "Land name must be at least 2 characters",
      });
    }

    const coordinates = data.location?.coordinates;
    if (!coordinates || coordinates.length !== 2) {
      ctx.addIssue({
        path: ["location"],
        code: z.ZodIssueCode.custom,
        message: "Please select location on map",
      });
      return;
    }

    const [longitude, latitude] = coordinates;

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      ctx.addIssue({
        path: ["location"],
        code: z.ZodIssueCode.custom,
        message: "Please select a valid map location",
      });
    }
  });

export type LocationDetailsForm = z.infer<typeof locationDetailsSchema>;

export const validateLocationDetails = (base: any) => {
  return locationDetailsSchema.safeParse({
    address: base.address,
    locality: base.locality,
    city: base.city,
    state: base.state,
    pincode: base.pincode,
    buildingName: base.buildingName,
    landName: base.landName,
    location: base.location,
    nearbyPlaces: base.nearbyPlaces,
  });
};

export const getLocationFieldError = (
  fieldErrors: any,
  fieldName: string,
): string | undefined => {
  return fieldErrors?.[fieldName]?.[0];
};
