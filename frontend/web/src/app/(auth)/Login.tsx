"use client";

import { requestOtp, verifyOtp } from "@/data/ClientData";
import { useState, useRef } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { VerifyOtpResponse } from "@/types/property";
import { LuPencilLine } from "react-icons/lu";
import { MdClose } from "react-icons/md";
import InputField from "@/ui/InputFiled";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const OTP_LENGTH = 4;

const LoginDialog = ({ open, onClose }: LoginDialogProps) => {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  const otp = otpDigits.join(""); // final OTP string

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const canRequestOtp = name.trim().length > 1 && emailRegex.test(email);
  const canVerifyOtp = otp.length === OTP_LENGTH;

  if (!open) return null; // don't render when closed

  async function handleRequestOtp() {
    if (!canRequestOtp) {
      setError("Please enter a valid name and email.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await requestOtp({ name: name.trim(), email: email.trim() });
      toast.success("OTP sent to your email. Please check your inbox.");
      setStep("verify");
    } catch (err) {
      setError("Something went wrong while requesting OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(manualOtp?: string | React.MouseEvent) {
    const otpToSubmit = typeof manualOtp === "string" ? manualOtp : otp;

    if (otpToSubmit.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit OTP you received.`);
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res: VerifyOtpResponse = await verifyOtp({
        name: name.trim(),
        email: email.trim(),
        otp: otpToSubmit,
      });

      Cookies.set("token", res.token, {
        secure: true,
        sameSite: "Strict",
      });

      toast.success("Logged in successfully!");
      setTimeout(() => {
        handleClose();
      }, 800);

      window.location.reload();
    } catch (err) {
      setError("Something went wrong while verifying OTP.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
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
    index: number
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
    setName("");
    setEmail("");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    setInfo(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* backdrop */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5">
        {/* Close button */}
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
              {step === "request" ? "Welcome Back" : "Verify OTP"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {step === "request"
                ? "Enter your details to access your account"
                : "Please enter the verification code sent to your email"}
            </p>
          </div>

          {step === "request" && (
            <div className="space-y-5">
              <InputField
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="Enter your full name"
              />
              <InputField
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email address"
              />

              <button
                disabled={!canRequestOtp || loading}
                onClick={handleRequestOtp}
                className="w-full rounded-xl bg-[#27AE60] py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-green-700/90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Get OTP"
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  New to Propenu?{" "}
                  <button className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-sm text-emerald-800">
                  Code sent to <span className="font-semibold">{email}</span>
                </p>
                <button
                  onClick={() => setStep("request")}
                  className="mt-1 flex w-full items-center justify-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  <LuPencilLine /> Edit Email
                </button>
              </div>

              <div className="flex justify-center gap-3">
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
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="h-14 w-14 rounded-xl border border-gray-200 bg-gray-50 text-center text-2xl font-bold text-gray-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                ))}
              </div>

              <button
                disabled={!canVerifyOtp || loading}
                onClick={handleVerifyOtp}
                className="w-full rounded-xl bg-[#27AE60] py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-green-700/90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                {loading ? (
                   <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Login"
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {info && !error && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-center text-sm text-emerald-600">
              {info}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginDialog;
