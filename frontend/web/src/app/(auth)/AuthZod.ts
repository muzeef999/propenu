import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

export const OTP_LENGTH = 4;

export const phoneSchema = z.object({
  phone: z.string().refine(isValidPhoneNumber, {
    message: "Invalid or incomplete phone number.",
  }),
});

export const accountSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required." })
    .email({ message: "Invalid email address." }),
  role: z.enum(["user", "builder", "agent"]),
});

export const locationSchema = z.object({
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "Pincode must be 6 digits." }),
  locality: z.string().trim().min(2, { message: "Locality is required." }),
  city: z.string().trim().min(2, { message: "City is required." }),
  state: z.string().trim().min(2, { message: "State is required." }),
});

export const otpSchema = z
  .string()
  .min(1, { message: "Please enter the OTP." })
  .length(OTP_LENGTH, { message: `OTP must be ${OTP_LENGTH} digits long.` });

export type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  pincode?: string;
  locality?: string;
  city?: string;
  state?: string;
  otp?: string;
};

export function mapAuthZodErrors(error: z.ZodError): FormErrors {
  const fieldErrors: FormErrors = {};

  error.issues.forEach((issue) => {
    const field = issue.path[0] as keyof FormErrors;
    if (field) fieldErrors[field] = issue.message;
  });

  return fieldErrors;
}
