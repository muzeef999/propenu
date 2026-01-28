import {z} from "zod";

export const commercialVerifySchema = z.object({
    reraRegistrationNumber: z.string({
        message: "RERA registration number is required",
    }),

    approvals: z.array(z.string({
        message: "Select at least one approval",
    })),


});

export const validateCommercialVerify = (data: any) => {
    return commercialVerifySchema.safeParse(data);
};