import { z } from "zod";
import { Types } from "mongoose";

/* ---------------------------------
   COMMON HELPERS
---------------------------------- */

export const objectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

export const optionalString = () =>
  z
    .string()
    .trim()
    .transform((val) => (val === "" ? undefined : val))
    .optional();

/* ---------------------------------
   ENUMS (API-FACING)
---------------------------------- */

export const LEAD_PROPERTY_TYPES = [
  "featuredprojects",
  "residentials",
  "commercials",
  "agriculturals",
  "landplots",
] as const;

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "approved",
  "rejected",
  "closed",
] as const;

/* ---------------------------------
   INTERNAL DB ENUM (IMPORTANT)
---------------------------------- */

export const LEAD_PROPERTY_MODELS = [
  "FeaturedProject",
  "Residential",
  "Commercial",
  "Agricultural",
  "LandPlot",
] as const;

/* ---------------------------------
   CREATE LEAD (REQUEST BODY)
---------------------------------- */

export const LeadCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email").optional(),

  projectId: objectIdSchema,

  propertyType: z.enum(LEAD_PROPERTY_TYPES),

  remarks: optionalString().refine(
    (val) => !val || val.length <= 2000,
    "Remarks cannot exceed 2000 characters"
  ),
});

/* ---------------------------------
   UPDATE LEAD (PATCH)
---------------------------------- */

export const LeadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  assignedTo: objectIdSchema.optional(),
  approvedByManager: z.boolean().optional(),
});

/* ---------------------------------
   DB / RESPONSE SCHEMA
---------------------------------- */

export const LeadDbSchema = LeadCreateSchema.extend({
  _id: objectIdSchema,

  propertyModel: z.enum(LEAD_PROPERTY_MODELS),

  status: z.enum(LEAD_STATUSES),
  assignedTo: objectIdSchema.nullable(),
  approvedByManager: z.boolean(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

/* ---------------------------------
   TYPES
---------------------------------- */

export type CreateLead = z.infer<typeof LeadCreateSchema>;
export type UpdateLead = z.infer<typeof LeadUpdateSchema>;
export type LeadDb = z.infer<typeof LeadDbSchema>;
