import { z } from "zod";
import { LEAD_STATUSES } from "./leadZod";

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
