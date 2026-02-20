import { z } from "zod";

export const PublicLeadSchemaZ = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2),
  phone: z.string().min(6),
  message: z.string().optional(),
});