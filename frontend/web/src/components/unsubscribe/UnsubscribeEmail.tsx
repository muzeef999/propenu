"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unsubscribeFromEmail } from "@/data/ClientData";
import { toast } from "sonner";
import { FiMail, FiPhone, FiCheckCircle, FiX } from "react-icons/fi";

type UnsubscribePayload = {
  email?: string;
  phone?: string;
  otp: string;
};

export default function UnsubscribeEmail() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<Array<string>>(
    Array(6).fill("")
  );
  const [step, setStep] = useState<"identifier" | "otp" | "success">(
    "identifier"
  );
  const [loading, setLoading] = useState(false);

  const handleUnsubscribe = async (payload: UnsubscribePayload) => {
    setLoading(true);
    try {
      const result = await unsubscribeFromEmail(payload);
      setLoading(false);
      setStep("success");
      toast.success(result.message);
    } catch (err: any) {
      setLoading(false);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to unsubscribe";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Unsubscribe from Emails
          </h2>
          <button
            onClick={() => queryClient?.removeQueries({ queryKey: ["unsubscribe"] })}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Close
          </button>
        </div>

        {step === "identifier" && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Choose how you'd like to verify your identity:
            </p>
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <FiMail className="h-5 w-5 text-primary-600" />
                  <span>Email address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                  disabled
                />
                <button
                  onClick={() => setStep("otp")}
                  disabled={!email}
                  className="mt-2 w-full rounded-md py-2 text-sm font-medium text-white shadow-lg transition-all btn-primary"
                >
                  Send OTP & Unsubscribe
                </button>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <FiPhone className="h-5 w-5 text-primary-600" />
                  <span>Phone number</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                  disabled
                />
                <button
                  onClick={() => setStep("otp")}
                  disabled={!phone}
                  className="mt-2 w-full rounded-md py-2 text-sm font-medium text-white shadow-lg transition-all btn-primary"
                >
                  Send OTP & Unsubscribe
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Enter the OTP sent to{' '}
              {email ? email : phone}{' '}
              {loading ? "..." : ""}
            </p>
            <div className="flex gap-2">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    setOtpDigits((prev) => {
                      const newDigits = [...prev];
                      newDigits[index] = e.target.value.replace(/\D/g, "").slice(0, 1);
                      return newDigits;
                    })}
                  onKeyDown={(e) =>
                    e.key === "Backspace"
                      ? setOtpDigits((prev) => {
                          const newDigits = [...prev];
                          newDigits[index] = "";
                          return newDigits;
                        })
                      : null
                  }
                  className="h-10 w-10 rounded-md border border-gray-300 bg-white text-center text-lg font-bold outline-none transition focus:border-primary-600 focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-400"
                />
              ))}
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setStep("identifier")}
                className="text-xs text-gray-500 hover:text-primary-600"
              >
                Use different method
              </button>
              <button
                onClick={async () => {
                  const payload: UnsubscribePayload = {
                    otp: otpDigits.join(""),
                    ...(email ? { email } : { phone }),
                  };
                  await handleUnsubscribe(payload);
                }}
                disabled={otpDigits.every((d) => d === "") || loading}
                className="mt-4 w-full rounded-md py-2 text-sm font-medium text-white shadow-lg transition-all btn-primary"
              >
                {loading ? "Verifying..." : "Unsubscribe"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="mt-8 p-6 bg-green-100 rounded-xl text-center">
            <FiCheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-800">Unsubscribed Successfully!</h3>
            <p className="text-gray-600">
              You have been unsubscribed from email notifications. You can resubscribe at any time.
            </p>
            <button
              onClick={() => queryClient.removeQueries({ queryKey: ["unsubscribe"] })}
              className="mt-4 rounded-md py-2 text-sm font-medium text-white shadow-lg transition-all btn-primary"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}