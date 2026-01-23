import { z } from "zod";

export const residentialVerifySchema = z.object({
  reraRegistrationNumber: z
    .string({
      message: "RERA registration number is required",
    
    }),

  approvals: z
    .array(z.string({
      message: "Select at least one approval",
    })),

  litigation: z.object({
    hasLitigation: z.boolean(),
  }),
});

export const validateResidentialVerify = (data: any) => {
  return residentialVerifySchema.safeParse(data);
};
