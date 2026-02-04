import { z } from "zod";

export const PropertyVerifySchema = z.object({
  verificationDocuments: z
    .array(z.instanceof(File), {
      message: "Verification document is required",
    })
    .min(1, "Please upload a verification document"),
});

export const validatePropertyVerify = (data: any) => {
  return PropertyVerifySchema.safeParse({
    verificationDocuments: data?.verificationDocuments,
  });
};
