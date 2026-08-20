"use client";

import {
  createRequestOtp,
  createVerifyOtp,
  me,
  requestOtp,
  syncShortlist,
  verifyOtp,
} from "@/data/ClientData";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { VerifyOtpResponse } from "@/types/property";
import Cookies from "js-cookie";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast } from "sonner";
import { z } from "zod";
import { LuPencilLine } from "react-icons/lu";
import { AiOutlineUser } from "react-icons/ai";
import { BsBuildings } from "react-icons/bs";
import {
  MdClose,
  MdOutlineBadge,
  MdOutlineWhatsapp,
} from "react-icons/md";
import {
  COMPANY_NAME_MAX_LENGTH,
  NAME_MAX_LENGTH,
  OTP_LENGTH,
} from "@/app/(auth)/AuthZod";

interface LeadAuthDialogProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: any) => Promise<void> | void;
  initialPhone?: string;
  initialPlanCategory?: "buy" | "rent_view";
}

type AuthMode = "existing" | "new";

const RESEND_OTP_SECONDS = 30;
const INDIA_COUNTRY_CODE = "+91";
const INDIA_PHONE_REGEX = /^\+91\d{10}$/;
const INDIA_PHONE_INPUT_MAX_LENGTH = 15;

const phoneSchema = z.string().regex(INDIA_PHONE_REGEX, {
  message: "Enter a valid 10-digit mobile number with +91.",
});

const otpSchema = z
  .string()
  .min(1, { message: "Please enter the OTP." })
  .length(OTP_LENGTH, { message: `OTP must be ${OTP_LENGTH} digits long.` });

function validateFullName(name: string) {
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

function saveAuthToken(token?: string) {
  if (!token) return;

  Cookies.set("token", token, {
    expires: 30,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event("auth-changed"));
}

function clearAuthToken() {
  Cookies.remove("token", { path: "/" });
  notifyAuthChanged();
}

async function syncLocalShortlistIfNeeded() {
  const localShortlist = JSON.parse(localStorage.getItem("shortlist") || "[]");

  if (localShortlist.length > 0) {
    await syncShortlist(localShortlist);
    localStorage.removeItem("shortlist");
  }
}

async function getAuthenticatedUserWithRetry(attempts = 3, delayMs = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const profile = await me();
      if (profile?.user) return profile.user;
    } catch {
      // Retry a couple of times in case the backend needs a moment after OTP verification.
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }

  return null;
}

export default function LeadAuthDialog({
  open,
  onClose,
  onAuthSuccess,
  initialPhone,
  initialPlanCategory,
}: LeadAuthDialogProps) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [mode, setMode] = useState<AuthMode>("existing");
  const [phone, setPhone] = useState(INDIA_COUNTRY_CODE);
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );
  const [profileData, setProfileData] = useState({
    role: "user" as "user" | "builder" | "agent",
    name: "",
    companyName: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const hadTokenOnOpenRef = useRef(false);
  const authCompletedRef = useRef(false);
  const otp = otpDigits.join("");

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    hadTokenOnOpenRef.current = Boolean(Cookies.get("token"));
    authCompletedRef.current = false;

    if (initialPhone?.trim()) {
      setPhone(initialPhone);
    }
  }, [initialPhone, open]);

  useEffect(() => {
    if (!open || step !== "verify" || resendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [open, resendCooldown, step]);

  function normalizeIndianPhone(value?: string) {
    if (!value) return INDIA_COUNTRY_CODE;

    const digitsOnly = value.replace(/\D/g, "");
    const nationalNumber = digitsOnly.startsWith("91")
      ? digitsOnly.slice(2)
      : digitsOnly;

    if (!nationalNumber) return INDIA_COUNTRY_CODE;

    return `${INDIA_COUNTRY_CODE}${nationalNumber.slice(0, 10)}`;
  }

  function resetDialogState() {
    setStep("request");
    setMode("existing");
    setPhone(INDIA_COUNTRY_CODE);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setProfileData({
      role: "user",
      name: "",
      companyName: "",
      email: "",
    });
    setLoading(false);
    setResendCooldown(0);
    setError(null);
  }

  function handleClose() {
    if (!authCompletedRef.current && !hadTokenOnOpenRef.current) {
      clearAuthToken();
    }
    resetDialogState();
    onClose();
  }

  async function finalizeAuth(res: VerifyOtpResponse) {
    authCompletedRef.current = true;
    saveAuthToken(res?.token);
    await syncLocalShortlistIfNeeded();
    const user = await getAuthenticatedUserWithRetry();

    if (!user) {
      authCompletedRef.current = false;
      clearAuthToken();
      setError("We couldn't complete verification. Please try again.");
      return;
    }

    notifyAuthChanged();

    if (onAuthSuccess) {
      try {
        await onAuthSuccess(user);
      } catch {
        // Auth succeeded; downstream lead submission errors are handled by the caller.
      }
      handleClose();
      return;
    }

    toast.success(
      mode === "new" ? "Account created successfully!" : "Logged in successfully!",
    );
    handleClose();
    window.location.reload();
  }

  async function handleRequestOtp(isResend = false) {
    if (isResend && resendCooldown > 0) return;

    const normalizedPhone = normalizeIndianPhone(phone);
    const validation = phoneSchema.safeParse(normalizedPhone);

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestOtp({ phone: normalizedPhone });
      setMode("existing");
      setPhone(normalizedPhone);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setResendCooldown(RESEND_OTP_SECONDS);
      setStep("verify");
      toast.success(
        isResend
          ? "OTP resent to your WhatsApp number"
          : "OTP sent to your WhatsApp number",
      );
      return;
    } catch (existingErr) {
      try {
        await createRequestOtp({ phone: normalizedPhone });
        setMode("new");
        setPhone(normalizedPhone);
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        setResendCooldown(RESEND_OTP_SECONDS);
        setStep("verify");
        toast.success(
          isResend
            ? "OTP resent to your WhatsApp number"
            : "OTP sent to your WhatsApp number",
        );
        return;
      } catch (createErr) {
        const existingMessage = axios.isAxiosError(existingErr)
          ? existingErr.response?.data?.message ||
            existingErr.response?.data?.error ||
            existingErr.response?.data
          : null;
        const createMessage = axios.isAxiosError(createErr)
          ? createErr.response?.data?.message ||
            createErr.response?.data?.error ||
            createErr.response?.data
          : null;

        setError(
          typeof createMessage === "string" && createMessage.trim()
            ? createMessage
            : typeof existingMessage === "string" && existingMessage.trim()
              ? existingMessage
              : "Something went wrong while requesting OTP.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(manualOtp?: string | React.MouseEvent) {
    const otpToSubmit = typeof manualOtp === "string" ? manualOtp : otp;
    const normalizedPhone = normalizeIndianPhone(phone);

    const otpValidation = otpSchema.safeParse(otpToSubmit);
    if (!otpValidation.success) {
      setError(otpValidation.error.issues[0].message);
      return;
    }

    if (mode === "new") {
      const nameError = validateFullName(profileData.name);
      if (nameError) {
        setError(nameError);
        return;
      }

      if (
        profileData.role === "builder" &&
        !profileData.companyName.trim()
      ) {
        setError("Company name is required for builders.");
        return;
      }

      if (
        profileData.email.trim() &&
        !z.string().email().safeParse(profileData.email.trim()).success
      ) {
        setError("Invalid email address.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "existing") {
        const res = await verifyOtp({
          phone: normalizedPhone,
          otp: otpToSubmit,
        });
        await finalizeAuth(res);
        return;
      }

      const res = await createVerifyOtp({
        name: profileData.name.trim(),
        companyName:
          profileData.role === "builder"
            ? profileData.companyName.trim()
            : undefined,
        email: profileData.email.trim() || undefined,
        role: profileData.role,
        phone: normalizedPhone,
        otp: otpToSubmit,
        viewerPlanCategory:
          profileData.role === "user" ? initialPlanCategory : undefined,
      });

      await finalizeAuth(res);
    } catch (err) {
      const backendMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data
        : null;

      setError(
        typeof backendMessage === "string" && backendMessage.trim()
          ? backendMessage
          : mode === "existing"
            ? "Invalid OTP or verification failed."
            : "Unable to create your account.",
      );
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    setError(null);
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
    inputsRef.current[Math.min(paste.length - 1, OTP_LENGTH - 1)]?.focus();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
            {step === "request"
              ? "Contact Owner"
              : mode === "new"
                ? "Contact Owner"
                : "Verify OTP"}
          </h2>
          <p className="mt-2 text-sm leading-5 text-[#7f8481]">
            {step === "request"
              ? "Enter your WhatsApp number to continue"
              : mode === "new"
                ? "Just a few details to continue"
                : "Please enter the verification code sent to your phone"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#ffffff] px-6 py-6 shadow-[0_-6px_20px_rgba(0,0,0,0.1)]">
          {step === "request" && (
            <div className="space-y-4">
              <div>
                <label className="font-normal text-[#1e1e1e]">
                  Enter WhatsApp Number
                </label>

                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-0.5">
                  <div className="phone-material flex items-center gap-3">
                    <PhoneInput
                      international
                      defaultCountry="IN"
                      countries={["IN"]}
                      withCountryCallingCode
                      limitMaxLength
                      countryCallingCodeEditable={false}
                      numberInputProps={{
                        maxLength: INDIA_PHONE_INPUT_MAX_LENGTH,
                        inputMode: "numeric",
                      }}
                      value={phone}
                      onChange={(value) => {
                        setPhone(value || INDIA_COUNTRY_CODE);
                        setError(null);
                      }}
                      placeholder="Enter your mobile number"
                      className="w-full"
                    />
                  </div>
                </div>
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              </div>

              <button
                onClick={() => handleRequestOtp()}
                disabled={loading}
                className="btn-primary w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <MdOutlineWhatsapp size={18} />
                    Get WhatsApp OTP
                  </span>
                )}
              </button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-5">
              <div>
                <label className="font-normal text-[#1e1e1e]">
                  WhatsApp Number
                </label>
                <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-base font-medium text-[#1f1f1f]">
                      {phone}
                    </p>
                    <button
                      onClick={() => {
                        setStep("request");
                        setOtpDigits(Array(OTP_LENGTH).fill(""));
                        setError(null);
                      }}
                      className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#28b463] hover:underline"
                    >
                      <LuPencilLine />
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div>
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
                      disabled={loading}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="h-10 w-10 rounded-md border border-[#d8ded9] bg-white text-center text-lg font-semibold text-[#1f1f1f] outline-none transition focus:border-[#28b463] focus:ring-2 focus:ring-[#cfead8] disabled:bg-[#f4f4f4] disabled:text-[#9aa39e]"
                    />
                  ))}
                </div>
                {error && (
                  <p className="mt-2 text-center text-xs text-red-600">
                    {error}
                  </p>
                )}
                <div className="mt-3 text-center text-xs text-[#7f8481]">
                  {resendCooldown > 0 ? (
                    <p>
                      Didn&apos;t get the OTP? Resend OTP in {resendCooldown}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp(true)}
                      disabled={loading}
                      className="cursor-pointer font-medium text-[#28b463] hover:underline disabled:cursor-not-allowed disabled:text-[#9aa39e] disabled:no-underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              {mode === "new" && (
                <>
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
                        const isActive = profileData.role === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setProfileData((prev) => ({
                                ...prev,
                                role: value as "user" | "builder" | "agent",
                              }));
                              setError(null);
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
                  </div>

                  <div>
                    <label className="font-normal text-[#1e1e1e]">
                      Full Name
                    </label>
                    <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                      <input
                        type="text"
                        value={profileData.name}
                        maxLength={NAME_MAX_LENGTH}
                        onChange={(e) => {
                          setProfileData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }));
                          setError(null);
                        }}
                        placeholder="Enter your full name"
                        className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                      />
                    </div>
                  </div>

                  {profileData.role === "builder" && (
                    <div>
                      <label className="font-normal text-[#1e1e1e]">
                        Company Name
                      </label>
                      <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                        <input
                          type="text"
                          value={profileData.companyName}
                          maxLength={COMPANY_NAME_MAX_LENGTH}
                          onChange={(e) => {
                            setProfileData((prev) => ({
                              ...prev,
                              companyName: e.target.value,
                            }));
                            setError(null);
                          }}
                          placeholder="Enter your company name"
                          className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-normal text-[#1e1e1e]">
                      Mail ID
                    </label>
                    <div className="mt-2 rounded-md bg-[#f2fcf6] px-4 py-2.5">
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => {
                          setProfileData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }));
                          setError(null);
                        }}
                        placeholder="Enter your mail id"
                        className="w-full border-none bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-[#a0a3a0]"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="btn-primary w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {mode === "new" ? "Creating Account..." : "Verifying..."}
                  </span>
                ) : mode === "new" ? (
                  "Continue"
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
