import { z } from "zod";
import { LEAD_PROPERTY_TYPES, LEAD_STATUSES } from "./leadZod";

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const PublicLeadSchemaZ = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2),
  phone: z.string().min(6),
  email: optionalString.pipe(z.string().email().optional()),
  message: optionalString,
  sourceCreatedAt: z.coerce.date().optional(),
  purchaseTimeline: optionalString,
  budgetRange: optionalString,
  status: z.enum(LEAD_STATUSES).optional(),
});

export const PublicPropertyLeadSchemaZ = z.object({
  projectId: z.string().min(1),
  propertyType: z.enum(LEAD_PROPERTY_TYPES),
  name: z.string().min(2),
  phone: z.string().min(6),
  email: optionalString.pipe(z.string().email().optional()),
  remarks: optionalString,
  listingType: z.enum(["sale", "rent", "lease"]).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
});
