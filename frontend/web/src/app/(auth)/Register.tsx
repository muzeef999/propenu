"use client";

import {
  createRequestOtp,
  createVerifyOtp,
  me,
} from "@/data/ClientData";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MdCheckCircle,
  MdClose,
  MdOutlineBadge,
} from "react-icons/md";
import { BsBuildings } from "react-icons/bs";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Cookies from "js-cookie";
import { AiOutlineUser } from "react-icons/ai";
import {
  accountSchema,
  COMPANY_NAME_MAX_LENGTH,
  FormErrors,
  mapAuthZodErrors,
  NAME_MAX_LENGTH,
  OTP_LENGTH,
  otpSchema,
  phoneSchema,
} from "./AuthZod";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface RegisterDialogProps {
  open: boolean;
  initialStep?: "personal" | "location";
  onClose: () => void;
  onSwitchToLogin: () => void;
}

function validateFullName(
  name: string,
  _role: "user" | "builder" | "agent",
): string {
  const value = name.trim();

  if (!value) return "Full name is required";
  if (value.length < 3) return "Name must be at least 3 characters";
  if (value.length > NAME_MAX_LENGTH) {
    return `Full name must not exceed ${NAME_MAX_LENGTH} characters`;
  }
  if (/\d/.test(value)) {
    return "Name cannot contain numbers";
  }

  return "";
}

const RESEND_OTP_SECONDS = 30;
const INTERNATIONAL_PHONE_INPUT_MAX_LENGTH = 15;
const INDIA_COUNTRY_CODE = "+91";
const INDIA_NATIONAL_NUMBER_LENGTH = 10;

const RegisterDialog = ({
  open,
  initialStep,
  onClose,
  onSwitchToLogin,
}: RegisterDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [existingAccountMessage, setExistingAccountMessage] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    "IN",
  );
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    role: "user" as "user" | "builder" | "agent",
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const otp = otpDigits.join("");
  const isPhoneValid = isValidPhoneNumber(phoneNumber);
  const shouldShowOtpInputs = isPhoneValid && otpRequested && !isOtpVerified;

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const lastOtpRequestedPhoneRef = useRef("");
  const lastOtpAttemptedPhoneRef = useRef("");
  const verifiedPhoneRef = useRef("");

  useBodyScrollLock(open);

  function normalizePhone(value: string) {
    const validation = phoneSchema.safeParse({ phone: value });
    return validation.success ? validation.data.phone : value;
  }

  function normalizePhoneInputByCountry(
    value: string,
    country?: string,
  ) {
    if (country !== "IN" || !value.startsWith(INDIA_COUNTRY_CODE)) {
      return value;
    }

    const digitsOnly = value.replace(/\D/g, "");
    const indianNationalNumber = digitsOnly
      .slice(INDIA_COUNTRY_CODE.replace("+", "").length)
      .slice(0, INDIA_NATIONAL_NUMBER_LENGTH);

    return `${INDIA_COUNTRY_CODE}${indianNationalNumber}`;
  }

  function isPreviouslyVerifiedPhone(value: string) {
    const normalizedPhone = normalizePhone(value);
    return (
      Boolean(verifiedPhoneRef.current) &&
      normalizedPhone === verifiedPhoneRef.current
    );
  }

  async function handleRegisterRequest(isResend = false) {
    if (isResend && resendCooldown > 0) return;

    if (isOtpVerified || isPreviouslyVerifiedPhone(phoneNumber)) {
      setIsOtpVerified(true);
      setOtpRequested(false);
      return;
    }

    const validation = phoneSchema.safeParse({ phone: phoneNumber });

    if (!validation.success) {
      setErrors((prev) => ({ ...prev, ...mapAuthZodErrors(validation.error) }));
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, phone: undefined, otp: undefined }));
    setExistingAccountMessage("");

    try {
      lastOtpAttemptedPhoneRef.current = validation.data.phone;
      await createRequestOtp({
        phone: validation.data.phone,
      });

      lastOtpRequestedPhoneRef.current = validation.data.phone;
      setOtpRequested(true);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setResendCooldown(RESEND_OTP_SECONDS);
      toast.success(
        isResend
          ? "OTP resent to your WhatsApp number"
          : "OTP sent to your WhatsApp number",
      );
      inputsRef.current[0]?.focus();
    } catch (err) {
      const backendMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data
        : null;
      const resolvedMessage =
        typeof backendMessage === "string" && backendMessage.trim()
          ? backendMessage
          : "Something went wrong while requesting OTP";
      setOtpRequested(false);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setResendCooldown(0);
      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 409 ||
          err.response?.data?.code === "ACCOUNT_EXISTS")
      ) {
        setExistingAccountMessage(resolvedMessage);
        setErrors((prev) => ({
          ...prev,
          phone: resolvedMessage,
        }));
      }

      toast.error(resolvedMessage);
    } finally {
      setLoading(false);
    }
  }

  function saveAuthToken(token?: string) {
    if (!token) return;

    Cookies.set("token", token, {
      expires: 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
    window.dispatchEvent(new Event("auth-changed"));
  }

  async function handlePersonalStepNext() {
    const accountValidation = accountSchema.safeParse(formData);
    const nameError = validateFullName(formData.name, formData.role);

    if (!accountValidation.success || nameError) {
      setErrors((prev) => ({
        ...prev,
        ...(accountValidation.success
          ? {}
          : mapAuthZodErrors(accountValidation.error)),
        ...(nameError ? { name: nameError } : {}),
      }));
      return;
    }

    if (isOtpVerified) {
      handleClose();
      return;
    }

    await handleVerifyOtp();
  }

  async function handleVerifyOtp() {
    const otpToSubmit = otp;

    const phoneValidation = phoneSchema.safeParse({ phone: phoneNumber });
    const accountValidation = accountSchema.safeParse(formData);
    const otpValidation = otpSchema.safeParse(otpToSubmit);

    if (
      !phoneValidation.success ||
      !accountValidation.success ||
      !otpValidation.success
    ) {
      setErrors((prev) => ({
        ...prev,
        ...(phoneValidation.success
          ? {}
          : mapAuthZodErrors(phoneValidation.error)),
        ...(accountValidation.success
          ? {}
          : mapAuthZodErrors(accountValidation.error)),
        ...(otpValidation.success
          ? {}
          : { otp: otpValidation.error.issues[0]?.message }),
      }));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: accountValidation.data.name,
        companyName:
          accountValidation.data.role === "builder"
            ? accountValidation.data.companyName
            : undefined,
        email: accountValidation.data.email,
        role: accountValidation.data.role,
        phone: phoneValidation.data.phone,
        otp: otpToSubmit,
      };

      const res = await createVerifyOtp(payload);

      saveAuthToken(res?.token);
      verifiedPhoneRef.current = phoneValidation.data.phone;
      setIsOtpVerified(true);
      toast.success("Account created successfully");
      handleClose();
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.field === "name") {
        setErrors((prev) => ({
          ...prev,
          name: errorData.message || "Invalid name",
        }));
      }
      if (errorData?.field === "companyName") {
        setErrors((prev) => ({
          ...prev,
          companyName: errorData.message || "Invalid company name",
        }));
      }
      toast.error(errorData?.message || "OTP verification failed");
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
    setPhoneNumber("");
    setExistingAccountMessage("");
    setOtpRequested(false);
    setIsOtpVerified(false);
    setResendCooldown(0);
    lastOtpRequestedPhoneRef.current = "";
    lastOtpAttemptedPhoneRef.current = "";
    verifiedPhoneRef.current = "";
    setFormData({
      name: "",
      companyName: "",
      email: "",
      role: "user",
    });
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setErrors({});
    onClose();
  }

  useEffect(() => {
    if (!open || !shouldShowOtpInputs) return;
    if (resendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [open, resendCooldown, shouldShowOtpInputs]);

  useEffect(() => {
    if (!isPhoneValid) return;
    if (isOtpVerified || isPreviouslyVerifiedPhone(phoneNumber)) return;
    if (loading) return;
    if (phoneNumber === lastOtpRequestedPhoneRef.current) return;
    if (phoneNumber === lastOtpAttemptedPhoneRef.current) return;

    handleRegisterRequest();
  }, [isPhoneValid, isOtpVerified, phoneNumber, loading]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await me();
        const user = data?.user;

        if (!user) return;

        setPhoneNumber(user.phone || "");
        verifiedPhoneRef.current =
          user.phoneVerified && user.phone ? normalizePhone(user.phone) : "";

        setFormData((prev) => ({
          ...prev,
          name: user.name || "",
          companyName: user.companyName || "",
          email: user.email || "",
          role:
            user.roleName === "builder" || user.roleName === "agent"
              ? user.roleName
              : "user",
        }));

        setIsOtpVerified(Boolean(user.phoneVerified));
        setExistingAccountMessage("");
        setOtpRequested(false);
      } catch {
        console.log("Failed to fetch user");
      }
    }

    if (open) {
      fetchUser();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initialStep !== "location") return;

    setExistingAccountMessage("");
    setIsOtpVerified(true);
    setOtpRequested(false);
  }, [initialStep, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Register dialog"
    >
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-50 max-h-[calc(100vh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-xl bg-[#f2fcf6] shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 cursor-pointer rounded-full p-1 text-[#8d908e] transition-colors hover:text-[#5e635f]"
          aria-label="Close"
        >
          <MdClose size={22} />
        </button>

        <div className="p-6 pb-3">
          <h2 className="pr-10 text-2xl font-medium leading-none text-[#28b463]">
            Create an Account
          </h2>
          <p className="mt-2 text-sm leading-5 text-[#7f8481]">
            Provide your personal details to create your account
          </p>
        </div>

        <div className="rounded-t-[26px] bg-[#ffffff] px-6 py-6 shadow-[0_-6px_20px_rgba(0,0,0,0.1)]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-normal text-[#1e1e1e]">
                Are you
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    value: "user",
                    label: "Buyer/Seller",
                    icon: AiOutlineUser,
                  },
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
                        setErrors((prev) => ({
                          ...prev,
                          role: undefined,
                          companyName: undefined,
                        }));
                      }}
                      className={`flex min-h-[46px] items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                        isActive
                          ? "border-[#28b463] bg-[#f2fcf6] text-[#28b463]"
                          : "border-transparent bg-[#f2fcf6] text-[#8a8d8b]"
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

            <div>
              <label className="font-normal text-[#1e1e1e]">Full Name</label>
              <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                <input
                  type="text"
                  value={formData.name}
                  maxLength={NAME_MAX_LENGTH}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name: value,
                    }));
                    const error = validateFullName(value, formData.role);
                    setErrors((prev) => ({
                      ...prev,
                      name: error || undefined,
                    }));
                  }}
                  placeholder="Enter your full name"
                  className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {formData.role === "builder" && (
              <div>
                <label className="font-normal text-[#1e1e1e]">
                  Company Name
                </label>
                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                  <input
                    type="text"
                    value={formData.companyName}
                    maxLength={COMPANY_NAME_MAX_LENGTH}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        companyName: undefined,
                      }));
                    }}
                    placeholder="Enter your company name"
                    className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                  />
                </div>
                {errors.companyName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.companyName}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="font-normal text-[#1e1e1e]">Mobile</label>

              <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-0.5">
                <div className="phone-material flex items-center gap-3">
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    limitMaxLength
                    countryCallingCodeEditable={false}
                    onCountryChange={(country) => {
                      setSelectedCountry(country);
                    }}
                    numberInputProps={{
                      maxLength: INTERNATIONAL_PHONE_INPUT_MAX_LENGTH,
                    }}
                    value={phoneNumber}
                    onChange={(value) => {
                      const nextPhone = normalizePhoneInputByCountry(
                        value || "",
                        selectedCountry,
                      );
                      const isSameVerifiedPhone =
                        isPreviouslyVerifiedPhone(nextPhone);

                      setPhoneNumber(nextPhone);
                      setExistingAccountMessage("");
                      setOtpRequested(false);
                      lastOtpAttemptedPhoneRef.current = "";
                      setErrors((prev) => ({
                        ...prev,
                        phone: undefined,
                        otp: undefined,
                      }));
                      setOtpDigits(Array(OTP_LENGTH).fill(""));
                      setResendCooldown(0);
                      setIsOtpVerified(isSameVerifiedPhone);
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
              {/* {existingAccountMessage && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSwitchToLogin();
                    }}
                    className="mt-2 text-xs font-semibold text-[#28b463] hover:underline"
                  >
                    Go to Login
                  </button>
                </div>
              )} */}

              {shouldShowOtpInputs && (
                <div className="mt-3">
                  <p className="mb-2 font-normal text-[#1e1e1e]">
                    Enter WhatsApp OTP
                  </p>
                  <div className="flex gap-3" onPaste={handleOtpPaste}>
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
                        onChange={(e) =>
                          handleOtpChange(e.target.value, index)
                        }
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="h-10 w-10 rounded-md border border-[#d8ded9] bg-white text-center text-lg font-semibold text-[#1f1f1f] outline-none transition focus:border-[#28b463] focus:ring-2 focus:ring-[#cfead8]"
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <p className="mt-2 text-center text-xs text-red-600">
                      {errors.otp}
                    </p>
                  )}
                  <div className="mt-3 text-center text-xs text-[#7f8481]">
                    {resendCooldown > 0 ? (
                      <p>Resend OTP in {resendCooldown}s</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegisterRequest(true)}
                        disabled={loading}
                        className="cursor-pointer font-medium text-[#28b463] hover:underline disabled:cursor-not-allowed disabled:text-[#9aa39e] disabled:no-underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="font-normal text-[#1e1e1e]">Mail ID</label>
              <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }));
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

            <button
              disabled={loading || Boolean(existingAccountMessage)}
              onClick={handlePersonalStepNext}
              className="btn-primary w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Create Account"}
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
        </div>
      </div>
    </div>
  );
};

export default RegisterDialog;
