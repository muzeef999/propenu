import { z } from "zod";

/* ---------------- Nearby Place Schema ---------------- */

const nearbyPlaceSchema = z.object({
  name: z.string().min(1, "Place name is required"),
  type: z.string().optional(),
  distanceText: z.string().optional(),
  coordinates: z
    .tuple([z.number(), z.number()])
    .optional(), // [lng, lat]
  order: z.number().optional(),
});

/* ---------------- Location Schema ---------------- */

export const locationDetailsSchema = z.object({
  address: z.string({
    message: "Address must be at least 10 characters",
  }),

  locality: z.string({
    message: "Locality is required",
  }),

  city: z.string({
    message: "City is required",
  }),

  state: z.string({
    message: "State is required",
  }),

  pincode: z
    .string({ message: "Pincode is required" })
    .regex(/^\d+$/, "Pincode must contain only numbers")
    .length(6, "Pincode must be 6 digits"),


  buildingName: z.string().optional(),
  landName: z.string().optional(),

  location: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]),
  }),

  nearbyPlaces: z.array(nearbyPlaceSchema).optional(),
})
  .superRefine((data, ctx) => {
    const isLandOrAgri = !!data.landName && !data.buildingName;

    /* ================= BUILDING / LAND NAME ================= */

    if (!data.buildingName && !data.landName) {
      ctx.addIssue({
        path: ["buildingName"],
        code: z.ZodIssueCode.custom,
        message: "Building or land name is required",
      });
    }

    /* ================= LOCATION ================= */

    if (!data.location?.coordinates?.length) {
      ctx.addIssue({
        path: ["location"],
        code: z.ZodIssueCode.custom,
        message: "Please select location on map",
      });
    }
  });



    /* ---------------- Types ---------------- */

    export type LocationDetailsForm = z.infer<
      typeof locationDetailsSchema
    >;

    /* ---------------- Validator ---------------- */

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

    export const getLocationFieldError = (fieldErrors: any, fieldName: string): string | undefined => {
      return fieldErrors?.[fieldName]?.[0];
    };
    

