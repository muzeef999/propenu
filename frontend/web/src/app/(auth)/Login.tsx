"use client";

import { requestOtp, syncShortlist, verifyOtp } from "@/data/ClientData";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import axios from "axios";
import { VerifyOtpResponse } from "@/types/property";
import { LuPencilLine } from "react-icons/lu";
import { MdClose, MdOutlineWhatsapp } from "react-icons/md";
import PhoneInput from "react-phone-number-input";
import { z } from "zod";
import "react-phone-number-input/style.css";
interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const OTP_LENGTH = 4;
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

const LoginDialog = ({
  open,
  onClose,
  onSwitchToRegister,
}: LoginDialogProps) => {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );

  const otp = otpDigits.join(""); // final OTP string

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState(INDIA_COUNTRY_CODE);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

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
  if (!open) return null; // don't render when closed

  async function handleVerifyOtp(manualOtp?: string | React.MouseEvent) {
    const otpToSubmit = typeof manualOtp === "string" ? manualOtp : otp;
    const normalizedPhone = normalizeIndianPhone(phone);

    const validation = otpSchema.safeParse(otpToSubmit);

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const res: VerifyOtpResponse = await verifyOtp({
        phone: normalizedPhone,
        otp: otpToSubmit,
      });

      Cookies.set("token", res.token, {
        path: "/",          // ✅ VERY IMPORTANT
        secure: true,
        sameSite: "Strict",
        expires: 30,
      });

      const localShortlist = JSON.parse(
      localStorage.getItem("shortlist") || "[]"
);

if (localShortlist.length > 0) {
  await syncShortlist(localShortlist);
  localStorage.removeItem("shortlist");
}

      toast.success("Logged in successfully!");

      setTimeout(handleClose, 800);
      
      window.location.reload();
    } catch (err) {
      const backendMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data
        : null;

      setError(
        typeof backendMessage === "string" && backendMessage.trim()
          ? backendMessage
          : "Invalid OTP or verification failed.",
      );
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    setError(null);
    const digit = value.replace(/\D/g, "").slice(0, 1); // only one number

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

    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === OTP_LENGTH) {
      inputsRef.current[OTP_LENGTH - 1]?.blur();
      handleVerifyOtp(combinedOtp);
    } else {
      const lastIndex = Math.min(paste.length - 1, OTP_LENGTH - 1);
      inputsRef.current[lastIndex]?.focus();
    }
  }

  function handleClose() {
    setStep("request");
    setPhone(INDIA_COUNTRY_CODE);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setResendCooldown(0);
    setError(null);
    onClose();
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

    try {
      await requestOtp({ phone: normalizedPhone });
      setPhone(normalizedPhone);
      toast.success(
        isResend
          ? "OTP resent to your WhatsApp number"
          : "OTP sent to your WhatsApp number",
      );
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setError(null);
      setResendCooldown(RESEND_OTP_SECONDS);
      setStep("verify");
    } catch (err) {
      const backendMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data
        : null;

      setError(
        typeof backendMessage === "string" && backendMessage.trim()
          ? backendMessage
          : "Something went wrong while requesting OTP.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-[440px] overflow-hidden rounded-xl bg-[#f2fcf6] shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-full p-1 text-[#8d908e] transition-colors hover:text-[#5e635f] cursor-pointer"
          aria-label="Close"
        >
          <MdClose size={22} />
        </button>

        <div className="p-6 pb-3">
          <h2 className="pr-10 text-2xl font-medium leading-none text-[#28b463]">
            {step === "request" ? "Welcome Back" : "Verify OTP"}
          </h2>
          <p className="mt-2 text-sm leading-5 text-[#7f8481]">
            {step === "request"
              ? "Enter your details to access your account"
              : "Please enter the verification code sent to your phone"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#ffffff] px-6 py-6 shadow-[0_-6px_20px_rgba(0,0,0,0.1)]">
          {step === "request" && (
            <div className="space-y-4">
              <div>
                <label className="font-normal text-[#1e1e1e]">
                  Enter Whatsapp Number
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
                {step === "request" && error && (
                  <p className="mt-1 text-xs text-red-600">{error}</p>
                )}
              </div>

              <button
                onClick={() => handleRequestOtp()}
                disabled={loading}
                className="w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all btn-primary"
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

              <div className="text-center">
                <p className="text-xs text-[#7f8481]">
                  New to Propenu?{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSwitchToRegister();
                    }}
                    className="cursor-pointer font-medium text-[#28b463] hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </div>
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
                {step === "verify" && error && (
                  <p className="mt-2 text-center text-xs text-red-600">{error}</p>
                )}
                <div className="mt-3 text-center text-xs text-[#7f8481]">
                  {resendCooldown > 0 ? (
                    <p>Didn&apos;t get the OTP? Resend OTP in {resendCooldown}s</p>
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

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full rounded-lg py-2.5 text-base font-semibold text-white shadow-lg transition-all btn-primary"
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
                    Verifying...
                  </span>
                ) : (
                  "Verify & Login"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginDialog;
