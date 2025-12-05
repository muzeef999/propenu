// src/zod/ownerPropertyValidation.ts
import { z } from "zod";

/**
 * Helper to support JSON parsing in multipart/form-data.
 * Allows sending objects/arrays as strings in Postman form-data.
 */
const jsonParse = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.string()]).transform((val) => {
    if (typeof val === "string") {
      try {
        return schema.parse(JSON.parse(val));
      } catch (e) {
        console.warn("JSON parse failed for:", val);
        return schema.parse(val);
      }
    }
    return val;
  });

/* -----------------------------------------
 * MEDIA SCHEMA
 * ----------------------------------------- */
export const MediaItemSchema = z.object({
  type: z.enum(["image", "video"]),
  title: z.string().optional(),
  filename: z.string().optional(),   // MUST match uploaded file.name
  url: z.string().optional(),        // after upload
});

/* -----------------------------------------
 * OWNER DETAILS (simple)
 * ----------------------------------------- */
const OwnerDetailsZ = jsonParse(
  z.object({
    ownerId: z.string(),
    ownerName: z.string().optional(),
    ownerContact: z.string().optional(),
  })
);

/* -----------------------------------------
 * OWNER PROPERTIES (advanced)
 * ----------------------------------------- */
const OwnerPropertiesZ = jsonParse(
  z.object({
    userRef: z.string().optional(),
    ownerName: z.string().optional(),
    ownerContact: z.string().optional(),
    ownerEmail: z.string().optional(),
    ownerType: z.string().optional(),
    agencyName: z.string().optional(),
    isVerified: z.boolean().optional(),
    documents: z
      .array(
        z.object({
          name: z.string(),
          url: z.string().optional(),
        })
      )
      .optional(),
  })
);

/* -----------------------------------------
 * LOCATION SCHEMA
 * ----------------------------------------- */
const LocationZ = jsonParse(
  z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    landmark: z.string().optional(),
    mapCoordinates: z
      .object({
        type: z.string().optional(),
        coordinates: z.array(z.number()).length(2),
      })
      .optional(),
  })
);

/* -----------------------------------------
 * LEGAL CERTIFICATION
 * ----------------------------------------- */
const LegalCertificationZ = jsonParse(
  z.array(
    z.object({
      name: z.string(),
      link: z.string().optional(),
      issuedBy: z.string().optional(),
      issuedDate: z.string().optional(),
    })
  )
);

/* -----------------------------------------
 * MAIN CREATE / UPDATE SCHEMA
 * ----------------------------------------- */
export const CreateOwnerPropertySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),

  category: z.string(),
  subcategory: z.string(),

  price: z.coerce.number().optional(),
  carpetArea: z.coerce.number().optional(),
  builtUpArea: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  balconies: z.coerce.number().optional(),
  totalFloors: z.coerce.number().optional(),
  floorNumber: z.coerce.number().optional(),

  furnishing: z.string().optional(),
  status: z.string().optional(),

  availabilityStatus: z
    .enum([
      "Ready to Move",
      "Under Construction",
      "Near Possession",
      "New Launch",
      "Pre Launch",
      "Under Renovation",
    ])
    .optional(),

  /* Complex JSON fields */
  ownerDetails: OwnerDetailsZ.optional(),
  ownerProperties: OwnerPropertiesZ.optional(),
  location: LocationZ.optional(),

  media: jsonParse(z.array(MediaItemSchema)).optional(),

  interiorDetails: jsonParse(z.record(z.string(), z.any())).optional(),
  nearby: jsonParse(z.record(z.string(), z.any())).optional(),

  amenities: jsonParse(z.array(z.string())).optional(),

  legalCertification: LegalCertificationZ.optional(),

  slug: z.string().optional(),
});

export const UpdateOwnerPropertySchema =
  CreateOwnerPropertySchema.partial();

/* Types */
export type CreateOwnerPropertyDTO = z.infer<typeof CreateOwnerPropertySchema>;
export type UpdateOwnerPropertyDTO = z.infer<typeof UpdateOwnerPropertySchema>;
