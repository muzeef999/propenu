"use client";

import { requestOtp, verifyOtp } from "@/data/ClientData";
import { useState } from "react";
import  { toast } from "sonner"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;




const Login = () => {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canRequestOtp = name.trim().length > 1 && emailRegex.test(email);
  const canVerifyOtp = otp.trim().length > 0;

  async function handleRequestOtp() {
    if (!canRequestOtp) {
      setError("Please enter a valid name and email.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await requestOtp({ name: name.trim(), email: email.trim() });

    //   if (!res.success) {
    //     setError(res.message ?? "Failed to send OTP. Please try again.");
    //     return;
    //   }

    toast.success("OTP sent to your email. Please check your inbox.");
       setInfo("OTP sent to your email. Please check your inbox.");
      setStep("verify");
    } catch (err) {
      setError("Something went wrong while requesting OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!canVerifyOtp) {
      setError("Please enter the OTP you received.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await verifyOtp({
        name: name.trim(),
        email: email.trim(),
        otp: otp.trim(),
      });

       

      setInfo("Logged in successfully! 🎉");
    } catch (err) {
      setError("Something went wrong while verifying OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Login with OTP
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your details to receive a one-time password.
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
              className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              We have sent an OTP to{" "}
              <span className="font-semibold">{email}</span>. Enter it below to
              continue.
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-[0.4em] text-center focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="----"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit email
              </button>
              <button
                disabled={!canVerifyOtp || loading}
                onClick={handleVerifyOtp}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {info && !error && (
          <p className="mt-4 text-sm text-emerald-600">
            {info}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
