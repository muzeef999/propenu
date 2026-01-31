import { z } from "zod";

export const residentialVerifySchema = z.object({
  verificationDocuments: z
    .array(z.instanceof(File), {
      message: "Verification document is required",
    })
    .min(1, "Please upload a verification document"),
});

export const validateResidentialVerify = (data: any) => {
  return residentialVerifySchema.safeParse({
    verificationDocuments: data?.verificationDocuments,
  });
};
