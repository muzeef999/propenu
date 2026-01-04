"use client";

import { createRequestOtp, createVerifyOtp } from "@/data/ClientData"; // Assuming 'register' function exists to handle user creation and OTP sending
import { useState, useRef } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { createVerifyOtpPayload, VerifyOtpResponse } from "@/types/property";
import { LuPencilLine } from "react-icons/lu";
import { MdClose } from "react-icons/md";
import InputField from "@/ui/InputFiled";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void; // To switch back to the login modal
}

const OTP_LENGTH = 4;

const RegisterDialog = ({
  open,
  onClose,
  onSwitchToLogin,
}: RegisterDialogProps) => {
  const [step, setStep] = useState<"details" | "verify">("details");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  const otp = otpDigits.join("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const canRequestOtp =
    formData.name.trim().length > 2 &&
    emailRegex.test(formData.email) &&
    Boolean(formData.role && formData.role.length > 0);
  const canVerifyOtp = otp.length === OTP_LENGTH;

  if (!open) return null;

  const handleInputChange =
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setError(null);
    };

  async function handleRegisterRequest() {
    if (!canRequestOtp) {
      setError("Please fill all fields correctly.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // NOTE: Assumes a `register` API function that handles user creation and sends an OTP.
      await createRequestOtp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
      });
      toast.success("OTP sent to your email. Please check your inbox.");
      setStep("verify");
    } catch (err) {
      setError(
        "An account with this email may already exist, or an error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(manualOtp?: string | React.MouseEvent) {
    const otpToSubmit = typeof manualOtp === "string" ? manualOtp : otp;

    if (otpToSubmit.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: createVerifyOtpPayload = await createVerifyOtp({
        email: formData.email.trim(),
        otp: otpToSubmit,
        name: formData.name.trim(),
        role: formData.role,
      });

      Cookies.set("token", res.token, { secure: true, sameSite: "Strict" });

      toast.success("Account created successfully!");
      setTimeout(() => {
        handleClose();
        window.location.reload();
      }, 800);
    } catch (err) {
      setError("Invalid OTP or an error occurred.");
      setOtpDigits(Array(OTP_LENGTH).fill("")); // Clear OTP fields on error
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
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
    index: number
  ) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!paste) return;

    const newOtp = Array.from(paste.padEnd(OTP_LENGTH, " "));
    setOtpDigits(newOtp);

    if (paste.length === OTP_LENGTH) {
      handleVerifyOtp(paste);
    } else {
      inputsRef.current[paste.length]?.focus();
    }
  }

  function handleClose() {
    setStep("details");
    setFormData({ name: "", email: "", role: "user" });
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
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
            <p className="mt-2 text-sm text-gray-500">
              {step === "details"
                ? "Join Propenu to find your perfect property."
                : `Enter the code sent to ${formData.email}`}
            </p>
          </div>

          {step === "details" && (
            <div className="space-y-5">
              <InputField
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={handleInputChange("name")}
                placeholder="Enter your full name"
              />
              <InputField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="Enter your email address"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange("role")(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="user">User</option>
                  <option value="builder">Builder</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <button
                disabled={!canRequestOtp || loading}
                onClick={handleRegisterRequest}
                className="w-full rounded-xl bg-[#27AE60] py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-green-700/90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Get OTP"}
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
                    className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6">
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
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

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterDialog;