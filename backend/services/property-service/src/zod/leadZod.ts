import { z } from "zod";
import { Types } from "mongoose";

/* ---------------------------------
   COMMON HELPERS
---------------------------------- */

// MongoDB ObjectId validator
export const objectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

// Optional string (handles empty string from UI)
export const optionalString = () =>
  z
    .string()
    .trim()
    .transform((val) => (val === "" ? undefined : val))
    .optional();

/* ---------------------------------
   ENUMS (Single Source of Truth)
---------------------------------- */

export const LEAD_PROPERTY_TYPES = [
  "residential",
  "commercial",
  "agricultural",
  "land",
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
   CREATE LEAD (POST)
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

export const LeadUpdateSchema = LeadCreateSchema.partial().extend({
  status: z.enum(LEAD_STATUSES).optional(),
  assignedTo: objectIdSchema.optional(),
  approvedByManager: z.boolean().optional(),
});

/* ---------------------------------
   DB / RESPONSE SCHEMA
---------------------------------- */

export const LeadSchema = LeadCreateSchema.extend({
  _id: objectIdSchema,
  status: z.enum(LEAD_STATUSES),
  assignedTo: objectIdSchema.optional(),
  approvedByManager: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/* ---------------------------------
   TYPES (Auto-inferred)
---------------------------------- */

export type CreateLead = z.infer<typeof LeadCreateSchema>;
export type UpdateLead = z.infer<typeof LeadUpdateSchema>;
export type Lead = z.infer<typeof LeadSchema>;
