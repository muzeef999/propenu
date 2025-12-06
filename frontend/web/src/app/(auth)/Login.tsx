"use client";

import { requestOtp, verifyOtp } from "@/data/ClientData";
import { useState, useRef } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { VerifyOtpResponse } from "@/types/property";
import { LuPencilLine } from "react-icons/lu";

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

  async function handleVerifyOtp() {
    if (!canVerifyOtp) {
      setError("Please enter the 6-digit OTP you received.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res: VerifyOtpResponse = await verifyOtp({
        name: name.trim(),
        email: email.trim(),
        otp, // from otpDigits.join("")
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

    const lastIndex = Math.min(paste.length - 1, OTP_LENGTH - 1);
    inputsRef.current[lastIndex]?.focus();
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

      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 text-xl text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
        <div className="mt-3 mb-6 h-px w-full bg-gray-200" />

        <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
          Welcome Back
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Enter your details to sign in
        </p>

        {step === "request" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="you@example.com"
              />
            </div>

            <button
              disabled={!canRequestOtp || loading}
              onClick={handleRequestOtp}
              className="btn-primary w-full cursor-pointer"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <div className="flex justify-center">
              <p className="cursor-pointer text-primary">
                New to Propenu? Create an account
              </p>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <p className="inline-flex items-center text-sm text-gray-600 gap-1">
              We have sent an OTP to
              <LuPencilLine className="text-gray-500" />
              <span
                className="font-semibold cursor-pointer"
                onClick={() => setStep("request")}
              >
                {email}
              </span>
              . Enter it below to continue.
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                OTP
              </label>
              <div className="flex justify-between gap-2">
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
                    className="h-11 w-11 rounded-lg border border-gray-300 bg-white text-center text-xl font-semibold text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Enter the 4-digit code sent to your email.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                disabled={!canVerifyOtp || loading}
                onClick={handleVerifyOtp}
                className="btn-primary w-full cursor-pointer"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {info && !error && (
          <p className="mt-4 text-sm text-emerald-600">{info}</p>
        )}
      </div>
    </div>
  );
};

export default LoginDialog;
