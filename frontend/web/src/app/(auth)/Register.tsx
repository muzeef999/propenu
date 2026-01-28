"use client";

import { createRequestOtp, createVerifyOtp } from "@/data/ClientData"; // Assuming 'register' function exists to handle user creation and OTP sending
import { useState, useRef } from "react";
import { toast } from "sonner";

import {
  MdClose,
  MdOutlineBadge,
  MdOutlineEngineering,
  MdOutlineWhatsapp,
} from "react-icons/md";
import InputField from "@/ui/InputField";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input"; // isValidPhoneNumber is crucial for Zod
import { z } from "zod";
import "react-phone-number-input/style.css";

import { AiOutlineTool, AiOutlineUser } from "react-icons/ai";

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void; // To switch back to the login modal
}

const OTP_LENGTH = 4;

const registerSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  phone: z.string().refine(isValidPhoneNumber, {
    message: "Invalid or incomplete phone number.",
  }),
  role: z.enum(["user", "builder", "agent"]),
});

const otpSchema = z
  .string()
  .min(1, { message: "Please enter the OTP." })
  .length(OTP_LENGTH, { message: `OTP must be ${OTP_LENGTH} digits long.` });

type FormErrors = {
  name?: string;
  phone?: string;
  role?: string;
  otp?: string;
};
const RegisterDialog = ({
  open,
  onClose,
  onSwitchToLogin,
}: RegisterDialogProps) => {
  const [step, setStep] = useState<"details" | "verify">("details");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "user",
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );

  const otp = otpDigits.join("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  if (!open) return null;

  function mapZodErrors(error: z.ZodError) {
    const fieldErrors: FormErrors = {};

    error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof FormErrors;
      if (field) fieldErrors[field] = issue.message;
    });

    return fieldErrors;
  }

  async function handleRegisterRequest() {
    const validation = registerSchema.safeParse(formData);

    if (!validation.success) {
      setErrors(mapZodErrors(validation.error));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await createRequestOtp({
        name: validation.data.name.trim(),
        phone: validation.data.phone,
        role: validation.data.role,
      });

      toast.success("OTP sent to your WhatsApp number");
      setStep("verify");
    } catch {
      toast.error("Account already exists or something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(manualOtp?: string | React.MouseEvent) {
    const otpToSubmit = typeof manualOtp === "string" ? manualOtp : otp;

    const validation = otpSchema.safeParse(otpToSubmit);
    if (!validation.success) {
      setErrors({ otp: validation.error.issues[0].message });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await createVerifyOtp({
        phone: formData.phone,
        otp: otpToSubmit,
        name: formData.name.trim(),
        role: formData.role,
      });

      // Cookies.set("token", res.token, { secure: true, sameSite: "Strict" });

      toast.success("Account created successfully!");
      setTimeout(() => {
        handleClose();
        window.location.reload();
      }, 800);
    } catch (err) {
      setErrors({ otp: "Invalid OTP or an error occurred." });
      setOtpDigits(Array(OTP_LENGTH).fill("")); // Clear OTP fields on error
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    setErrors((p) => ({ ...p, otp: undefined }));
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === OTP_LENGTH) {
      inputsRef.current[index]?.blur();
      handleVerifyOtp(combinedOtp);
    }
  }

  function handleOtpKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!paste) return;

    const newOtp = [...otpDigits];
    for (let i = 0; i < OTP_LENGTH; i++) {
      newOtp[i] = paste[i] ?? "";
    }
    setOtpDigits(newOtp);

    if (paste.length === OTP_LENGTH) {
      handleVerifyOtp(paste);
    } else {
      inputsRef.current[paste.length - 1]?.focus();
    }
  }

  function handleClose() {
    setStep("details");
    setFormData({ name: "", phone: "", role: "user" });
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setErrors({});
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
          aria-label="Close"
        >
          <MdClose size={22} />
        </button>

        <div className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              {step === "details" ? "Create an Account" : "Verify OTP"}
            </h2>
            <p className="mt-1  text-sm text-gray-500">
              {step === "details"
                ? "Trust begins with verified users. Get started now!"
                : `Enter the code sent to ${formData.phone}`}
            </p>
          </div>

          {step === "details" && (
            <div className="space-y-5">
              <div className="relative mt-4">
                <label className="text-sm font-medium text-[#374254]">
                  Full Name
                </label>

                <div className="mt-1 border-b-2 border-emerald-200 focus-within:border-emerald-500 transition-colors">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, name: e.target.value }));
                      setErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder="Enter your full name"
                    className=" w-full border-none bg-transparent py-1 text-sm outline-none  placeholder-gray-400"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="relative mt-4">
                <label className="text-sm font-medium text-[#374254]">
                  Enter Phone Number
                </label>

                <div className="phone-underline mt-1">
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    value={formData.phone}
                    onChange={(value) => {
                      setFormData((p) => ({ ...p, phone: value || "" }));
                      setErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    placeholder=" "
                    className="phone-material"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Role
                </label>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "user", label: "User", icon: AiOutlineUser },
                    {
                      value: "builder",
                      label: "Builder",
                      icon: AiOutlineTool,
                    },
                    { value: "agent", label: "Agent", icon: MdOutlineBadge },
                  ].map(({ value, label, icon: Icon }) => {
                    const isActive = formData.role === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, role: value }));
                          setErrors((p) => ({ ...p, role: undefined }));
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm f transition-all${isActive ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300" : "border-gray-200 bg-white text-gray-700 hover:border-emerald-400"
                          }`}
                      >
                        <Icon size={22} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.role && (
                  <p className="mt-2 text-xs text-red-600">{errors.role}</p>
                )}
              </div>

              <button
                disabled={loading}
                onClick={handleRegisterRequest}
                className="w-full rounded-md py-3 text-sm font-semibold text-white shadow-lg transition-all btn-primary"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <MdOutlineWhatsapp size={18} />
                    Get WhatsApp OTP
                  </span>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSwitchToLogin();
                    }}
                    className="font-medium text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6">
              <div
                className="flex justify-center gap-3"
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="h-14 w-14 rounded-xl border border-gray-200 bg-gray-50 text-center text-2xl font-bold text-gray-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                ))}
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Didn't receive a code?{" "}
                  <button
                    onClick={handleRegisterRequest}
                    disabled={loading}
                    className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    Resend OTP
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterDialog;
