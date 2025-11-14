// src/validators/entities.validator.ts
import { z } from "zod";

/**
 * Shared helpers
 */
export const ObjectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid Mongo ObjectId string",
});

export const ContactSchema = z.object({
  phone: z.string().min(3).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

export const VerificationDocumentSchema = z.object({
  type: z
    .object({
      type: z.string().optional(),
    })
    .optional(),
  url: z.string().url().optional(),
  providerResponse: z.any().optional(),
  status: z.string().optional(),
});


/**
 * ========== Agent Schemas ==========
 *
 * createAgentSchema  - strict full create schema
 * updateAgentSchema  - partial allowed for PATCH
 */
export const createAgentSchema = z
  .object({
    user: ObjectIdString, // or z.string().min(1) if you prefer looser validation
    name: z.string().min(1),
    slug: z.string().optional(),
    avatar: z.string().url().optional(),
    coverImage: z.string().url().optional(),
    bio: z.string().optional(),
    agencyName: z.string().optional(),
    licenseNumber: z.string().optional(),
    licenseValidTill: z
      .union([z.string(), z.date()])
      .optional()
      .transform((val) => (typeof val === "string" ? new Date(val) : val)),
    areasServed: z.array(z.string()).optional(),
    contacts: z.array(
      z.object({
        type: z.enum(["mobile", "whatsapp", "email", "office"]).optional(),
        value: z.string().min(3),
      })
    ).optional(),
    verificationDocuments: z.array(VerificationDocumentSchema).optional(),
    rera: z
      .object({
        reraAgentId: z.string().optional(),
        providerResponse: z.any().optional(),
        isVerified: z.boolean().optional(),
      })
      .optional(),
  })
  .strict();

export const updateAgentSchema = createAgentSchema.partial().strict();

export type CreateAgentDTO = z.infer<typeof createAgentSchema>;
export type UpdateAgentDTO = z.infer<typeof updateAgentSchema>;



/**
 * ========== Builder Schemas ==========
 *
 * createBuilderSchema - strict full create schema
 * updateBuilderSchema - partial allowed for PATCH
 */

export const GstSchema = z.object({
  gstin: z.string().optional(),
  providerResponse: z.any().optional(),
});

export const McaSchema = z.object({
  cin: z.string().optional(),
  providerResponse: z.any().optional(),
});

export const ReraSchema = z.object({
  reraId: z.string().optional(),
  providerResponse: z.any().optional(),
  isVerified: z.boolean().optional(),
});

export const StatsSchema = z.object({
  totalProperties: z.number().int().nonnegative().optional(),
  publishedCount: z.number().int().nonnegative().optional(),
});

export const VerificationStatusEnum = z.enum([
  "pending",
  "approved",
  "rejected",
  "business_verified",
]);

export const createBuilderSchema = z
  .object({
    user: ObjectIdString,
    name: z.string().min(1),
    slug: z.string().optional(),
    company: z.string().optional(),
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
    coverImage: z.string().url().optional(),
    contact: ContactSchema.optional(),
    officeLocations: z.array(z.string()).optional(),
    verified: z.boolean().optional(),
    verificationStatus: VerificationStatusEnum.optional(),
    verificationDocuments: z.array(VerificationDocumentSchema).optional(),
    gst: GstSchema.optional(),
    mca: McaSchema.optional(),
    rera: ReraSchema.optional(),
    stats: StatsSchema.optional(),
  })
  .strict();

export const updateBuilderSchema = createBuilderSchema.partial().strict();

export type CreateBuilderDTO = z.infer<typeof createBuilderSchema>;
export type UpdateBuilderDTO = z.infer<typeof updateBuilderSchema>;


