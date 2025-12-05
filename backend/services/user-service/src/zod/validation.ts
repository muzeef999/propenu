import { z } from "zod";

export const ObjectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const VerificationDocumentSchema = z.object({
  type: z.string().optional(),
  url: z.string().optional(),
  providerResponse: z.any().optional(),
  status: z.string().optional(),
});

// Convert "123" → 123
const numberOrStringToNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null) return undefined;
    return typeof val === "string" ? Number(val) : val;
  });

// Convert "true"/"false" → boolean
const booleanOrStringToBool = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (typeof val === "boolean") return val;
    return val === "true"; // anything else becomes false
  });

export const createAgentSchema = z
  .object({
    user: ObjectIdString,
    name: z.string().min(1),

    slug: z.string().optional(),

    avatar: z.any().optional(), // multer files handled separately
    coverImage: z.any().optional(),

    bio: z.string().optional(),
    agencyName: z.string().optional(),
    licenseNumber: z.string().optional(),

    licenseValidTill: z
      .union([z.string(), z.date()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        return typeof val === "string" ? new Date(val) : val;
      }),

    areasServed: z.array(z.string()).optional(),

    city: z.string().optional(),

    // FIXED ↓
    experienceYears: numberOrStringToNumber,
    dealsClosed: numberOrStringToNumber,
    languages: z.array(z.string()).optional(),

    verificationStatus: z.enum(["pending", "approved", "rejected"]).optional(),

    verificationDocuments: z.array(VerificationDocumentSchema).optional(),

    rera: z
      .object({
        reraAgentId: z.string().optional(),
        providerResponse: z.any().optional(),
        isVerified: booleanOrStringToBool, // FIXED
      })
      .optional(),

    stats: z
      .object({
        totalProperties: numberOrStringToNumber, // FIXED
        publishedCount: numberOrStringToNumber, // FIXED
      })
      .optional(),
  })
  .strict();

export const updateAgentSchema = createAgentSchema.partial().strict();

export type CreateAgentDTO = z.infer<typeof createAgentSchema>;
export type UpdateAgentDTO = z.infer<typeof updateAgentSchema>;
