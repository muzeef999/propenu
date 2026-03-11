"use client";

import KycButton from "@/app/(account)/settings/KycButton";
import { createRequestOtp, createVerifyOtp, startKyc } from "@/data/ClientData";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MdCheckCircle,
  MdClose,
  MdOutlineBadge,
  MdOutlineLock,
  MdOutlineWhatsapp,
} from "react-icons/md";
import { BsBuildings } from "react-icons/bs";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";
import "react-phone-number-input/style.css";
import Cookies from "js-cookie";
import { AiOutlineUser } from "react-icons/ai";

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const OTP_LENGTH = 4;

const phoneSchema = z.object({
  phone: z.string().refine(isValidPhoneNumber, {
    message: "Invalid or incomplete phone number.",
  }),
});

const accountSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  role: z.enum(["user", "builder", "agent"]),
});

const locationSchema = z.object({
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "Pincode must be 6 digits." }),
  locality: z.string().trim().min(2, { message: "Locality is required." }),
  city: z.string().trim().min(2, { message: "City is required." }),
  state: z.string().trim().min(2, { message: "State is required." }),
});

const otpSchema = z
  .string()
  .min(1, { message: "Please enter the OTP." })
  .length(OTP_LENGTH, { message: `OTP must be ${OTP_LENGTH} digits long.` });

type FormErrors = {
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

type RegisterStep = "personal" | "location" | "kyc";

const tabs: { id: RegisterStep; label: string }[] = [
  { id: "personal", label: "Personal Details" },
  { id: "location", label: "Location" },
  { id: "kyc", label: "KYC Verification" },
];

const RegisterDialog = ({
  open,
  onClose,
  onSwitchToLogin,
}: RegisterDialogProps) => {
  const [step, setStep] = useState<RegisterStep>("personal");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user" as "user" | "builder" | "agent",
    pincode: "",
    locality: "",
    city: "",
    state: "",
  });

  const [signupPayload, setSignupPayload] = useState({
    name: "",
    role: "user" as "user" | "builder" | "agent",
    phone: "",
    otp: "",
    pincode: "",
    locality: "",
    city: "",
    state: "",
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const otp = otpDigits.join("");
  const showPhoneStepOtp = isValidPhoneNumber(phoneNumber);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const lastOtpRequestedPhoneRef = useRef("");

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
    const validation = phoneSchema.safeParse({ phone: phoneNumber });

    if (!validation.success) {
      setErrors((prev) => ({ ...prev, ...mapZodErrors(validation.error) }));
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, phone: undefined, otp: undefined }));

    try {
      await createRequestOtp({
        phone: validation.data.phone,
      });

      lastOtpRequestedPhoneRef.current = validation.data.phone;
      toast.success("OTP sent to your WhatsApp number");
      inputsRef.current[0]?.focus();
    } catch {
      toast.error("Account already exists or something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(manualOtp?: string | React.MouseEvent) {
    const otpToSubmit = typeof manualOtp === "string" ? manualOtp : otp;
    const phoneValidation = phoneSchema.safeParse({ phone: phoneNumber });
    if (!phoneValidation.success) {
      setErrors((prev) => ({ ...prev, ...mapZodErrors(phoneValidation.error) }));
      return;
    }

    const accountValidation = accountSchema.safeParse(formData);
    if (!accountValidation.success) {
      setErrors((prev) => ({ ...prev, ...mapZodErrors(accountValidation.error) }));
      return;
    }

    const otpValidation = otpSchema.safeParse(otpToSubmit);
    if (!otpValidation.success) {
      setErrors((prev) => ({
        ...prev,
        otp: otpValidation.error.issues[0].message,
      }));
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      setSignupPayload({
        name: accountValidation.data.name.trim(),
        role: accountValidation.data.role,
        phone: phoneValidation.data.phone,
        otp: otpToSubmit,
        pincode: "",
        locality: "",
        city: "",
        state: "",
      });

      setIsOtpVerified(true);
      setStep("location");
      toast.success("OTP verified successfully");
    } catch {
      setErrors({ otp: "Invalid OTP or an error occurred." });
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleLocationContinue() {
    const validation = locationSchema.safeParse(formData);

    if (!validation.success) {
      setErrors((prev) => ({ ...prev, ...mapZodErrors(validation.error) }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      pincode: undefined,
      locality: undefined,
      city: undefined,
      state: undefined,
    }));
    setStep("kyc");
  }

  async function handleCompleteRegistration() {
    const validation = locationSchema.safeParse(formData);

    if (!validation.success) {
      setErrors((prev) => ({ ...prev, ...mapZodErrors(validation.error) }));
      setStep("location");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...signupPayload,
        locality: validation.data.locality.trim(),
        city: validation.data.city.trim(),
        state: validation.data.state.trim(),
        pincode: validation.data.pincode.trim(),
      };

      const res = await createVerifyOtp(payload);

      if (res.token) {
        Cookies.set("token", res.token, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
        });
      }

      toast.success("Account created successfully!");

      const kycData = await startKyc();

      if (kycData?.url) {
        window.location.href = kycData.url;
        return;
      }

      handleClose();
      window.location.href = "/";
    } catch {
      toast.error("Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    setErrors((prev) => ({ ...prev, otp: undefined }));
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const nextOtp = [...otpDigits];
    nextOtp[index] = digit;
    setOtpDigits(nextOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
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

    const nextOtp = [...otpDigits];
    for (let i = 0; i < OTP_LENGTH; i++) {
      nextOtp[i] = paste[i] ?? "";
    }
    setOtpDigits(nextOtp);
    inputsRef.current[Math.max(paste.length - 1, 0)]?.focus();
  }

  function handleClose() {
    setStep("personal");
    setPhoneNumber("");
    setIsOtpVerified(false);
    lastOtpRequestedPhoneRef.current = "";
    setFormData({
      name: "",
      email: "",
      role: "user",
      pincode: "",
      locality: "",
      city: "",
      state: "",
    });
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setErrors({});
    onClose();
  }

  function handleTabClick(nextStep: RegisterStep) {
    if (nextStep === "personal") {
      setStep("personal");
      return;
    }

    if (nextStep === "location" && isOtpVerified) {
      setStep("location");
      return;
    }

    if (nextStep === "kyc" && isOtpVerified) {
      const validation = locationSchema.safeParse(formData);
      if (validation.success) {
        setStep("kyc");
      }
    }
  }

  useEffect(() => {
    if (step !== "personal") return;
    if (!showPhoneStepOtp) return;
    if (loading) return;
    if (phoneNumber === lastOtpRequestedPhoneRef.current) return;

    handleRegisterRequest();
  }, [step, showPhoneStepOtp, phoneNumber, loading]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-[440px] overflow-hidden rounded-[28px] bg-[#dfe6e1] shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-full p-1 text-[#8d908e] transition-colors hover:text-[#5e635f]"
          aria-label="Close"
        >
          <MdClose size={22} />
        </button>

        <div className="p-4 pb-3">
          <h2 className="pr-10 text-2xl font-medium leading-none text-[#28b463]">
            Create an Account
          </h2>
          <p className="mt-2 max-w-[320px] text-sm leading-5 text-[#7f8481]">
            Provide your personal details to create your account
          </p>

          <div className="mt-3 flex gap-5 text-[0.9rem]">
            {tabs.map((tab) => {
              const isActive = step === tab.id;
              const isEnabled =
                tab.id === "personal" ||
                (tab.id === "location" && isOtpVerified) ||
                (tab.id === "kyc" && isOtpVerified);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  disabled={!isEnabled}
                  className={`border-b-2 pb-2 text-left transition ${
                    isActive
                      ? "border-[#28b463] text-[#28b463]"
                      : "border-[#b6b8b6] text-[#8d908e]"
                  } ${!isEnabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-t-[26px] bg-[#f7f5f5] px-6 py-6">
          {step === "personal" && (
            <div className="space-y-4">
              <div>
                <label className="text-[1.05rem] font-medium text-[#1e1e1e]">
                  Full Name
                </label>
                <div className="mt-2 rounded-xl bg-[#e7efea] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }));
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Enter your full name"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="text-[1.05rem] font-medium text-[#1e1e1e]">
                  Mobile{" "}
                  <span className="text-sm font-normal text-[#9ca09d]">
                    (aadhaar linked mobile number)
                  </span>
                </label>

                <div className="mt-2 rounded-xl bg-[#e7efea] px-4 py-0.5">
                  <div className="phone-material flex items-center gap-3">
                    <PhoneInput
                      international
                      defaultCountry="IN"
                      value={phoneNumber}
                      onChange={(value) => {
                        setPhoneNumber(value || "");
                        setErrors((prev) => ({
                          ...prev,
                          phone: undefined,
                          otp: undefined,
                        }));
                        setOtpDigits(Array(OTP_LENGTH).fill(""));
                        setIsOtpVerified(false);
                      }}
                      placeholder="Enter your mobile number"
                      className="w-full"
                    />
                    {isOtpVerified && (
                      <MdCheckCircle className="shrink-0 text-[1.6rem] text-[#28b463]" />
                    )}
                  </div>
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}

                {showPhoneStepOtp && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm text-[#7f8481]">
                      Enter WhatsApp OTP
                    </p>
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
                          className="h-10 w-10 rounded-xl border border-[#d8ded9] bg-white text-center text-lg font-semibold text-[#1f1f1f] outline-none transition focus:border-[#28b463] focus:ring-2 focus:ring-[#cfead8]"
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="mt-2 text-center text-xs text-red-600">
                        {errors.otp}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[1.05rem] font-medium text-[#1e1e1e]">
                  Mail ID
                </label>
                <div className="mt-2 rounded-xl bg-[#e7efea] px-4 py-2.5">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="Enter your mail id"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[1.05rem] font-medium text-[#1e1e1e]">
                  You are a
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { value: "user", label: "Buyer/Seller", icon: AiOutlineUser },
                    { value: "agent", label: "Agent", icon: MdOutlineBadge },
                    { value: "builder", label: "Builder", icon: BsBuildings },
                  ].map(({ value, label, icon: Icon }) => {
                    const isActive = formData.role === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            role: value as "user" | "builder" | "agent",
                          }));
                          setErrors((prev) => ({ ...prev, role: undefined }));
                        }}
                        className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                          isActive
                            ? "border-[#28b463] bg-[#eef8f1] text-[#28b463]"
                            : "border-transparent bg-[#e7efea] text-[#8a8d8b]"
                        }`}
                      >
                        <Icon size={20} />
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
                disabled={loading || !showPhoneStepOtp}
                onClick={handleVerifyOtp}
                className="w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all btn-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  "Verifying..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <MdOutlineWhatsapp size={18} />
                    Next
                  </span>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-[#7f8481]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSwitchToLogin();
                    }}
                    className="cursor-pointer font-medium text-[#28b463] hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </div>
          )}

          {step === "location" && (
            <div className="space-y-4">
              <div>
                <label className="text-[1.05rem] font-medium text-[#1e1e1e]">
                  Pincode
                </label>
                <div className="mt-2 rounded-xl bg-[#e7efea] px-4 py-2.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.pincode}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                      }));
                      setErrors((prev) => ({ ...prev, pincode: undefined }));
                    }}
                    placeholder="Enter pincode"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.pincode && (
                  <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>
                )}
              </div>

              <div>
                <label className="text-[1.05rem] font-medium text-[#1e1e1e]">
                  Locality
                </label>
                <div className="mt-2 rounded-xl bg-[#e7efea] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.locality}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, locality: e.target.value }));
                      setErrors((prev) => ({ ...prev, locality: undefined }));
                    }}
                    placeholder="Enter locality"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.locality && (
                  <p className="mt-1 text-xs text-red-600">{errors.locality}</p>
                )}
              </div>

              <div>
                <label className="text-[1.05rem] font-medium text-[#1e1e1e]">
                  City
                </label>
                <div className="mt-2 rounded-xl bg-[#e7efea] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, city: e.target.value }));
                      setErrors((prev) => ({ ...prev, city: undefined }));
                    }}
                    placeholder="Enter city"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.city && (
                  <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="text-[1.05rem] font-medium text-[#1e1e1e]">
                  State
                </label>
                <div className="mt-2 rounded-xl bg-[#e7efea] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, state: e.target.value }));
                      setErrors((prev) => ({ ...prev, state: undefined }));
                    }}
                    placeholder="Enter state"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("personal")}
                  className="w-full rounded-lg border border-[#c8ceca] py-2.5 text-base font-semibold text-[#6b706d] transition hover:bg-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleLocationContinue}
                  className="w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all btn-primary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
  
          {step === "kyc" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[2rem] font-medium leading-none text-[#1f1f1f]">
                  Verify with DigiLocker
                </h3>
                <div className="mt-5 rounded-xl bg-[#e7efea] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 text-base font-medium text-[#1f1f1f]">
                      {phoneNumber || "-"}
                    </div>
                    <MdCheckCircle className="shrink-0 text-[1.6rem] text-[#28b463]" />
                  </div>
                </div>
                <p className="mt-2 text-sm text-[#8b8f8c]">
                  This number will be used for KYC verification
                </p>
              </div>

              <div className="space-y-5 py-1">
                {[
                  "Real users, verified identities",
                  "One-time KYC verification",
                  "Safe & secure platform",
                  "Zero spam & fake accounts",
                  "Connect with genuine leads",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <MdCheckCircle className="shrink-0 text-lg text-[#28b463]" />
                    <span className="text-[1.02rem] text-[#1f1f1f]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-[#8b8f8c]">
                <MdOutlineLock className="text-base" />
                <span>secure & government approved DigiLocker verification</span>
              </div>

              <div className="pt-2">
                <KycButton
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterDialog;
