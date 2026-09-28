"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

interface HomeLoanApplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
}

export default function HomeLoanApplyDialog({
  isOpen,
  onClose,
  titleId,
}: HomeLoanApplyDialogProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [formErrors, setFormErrors] = useState({
    fullName: "",
    mobileNumber: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const resetForm = () => {
    setIsSubmitted(false);
    setFullName("");
    setMobileNumber("");
    setFormErrors({ fullName: "", mobileNumber: "" });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleApplySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = fullName.trim();
    const normalizedMobile = mobileNumber.replace(/\D/g, "");
    const nextErrors = {
      fullName: "",
      mobileNumber: "",
    };

    if (!normalizedName) {
      nextErrors.fullName = "Please enter your full name.";
    } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(normalizedName)) {
      nextErrors.fullName = "Name can contain letters and spaces only.";
    } else if (normalizedName.length < 3) {
      nextErrors.fullName = "Name must be at least 3 letters.";
    }

    if (!normalizedMobile) {
      nextErrors.mobileNumber = "Please enter your mobile number.";
    } else if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
      nextErrors.mobileNumber = "Enter a valid 10-digit mobile number.";
    }

    if (nextErrors.fullName || nextErrors.mobileNumber) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({ fullName: "", mobileNumber: "" });
    setIsSubmitted(true);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 p-4 transition-opacity"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`relative w-full rounded-2xl bg-white shadow-2xl ${
          isSubmitted ? "max-w-[340px] px-5 py-6" : "max-w-[380px] p-5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isSubmitted ? (
          <form onSubmit={handleApplySubmit}>
            <div className="mb-6 flex items-start justify-between gap-3">
              <h3 id={titleId} className="text-xl font-semibold text-gray-950">
                Apply for Home Loan
              </h3>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close apply form"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <label className="block text-xs font-medium text-gray-700">
              Full Name<span className="text-red-500">*</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/[^A-Za-z\s]/g, "");
                  setFullName(nextValue.replace(/\s{2,}/g, " "));
                  setFormErrors((current) => ({ ...current, fullName: "" }));
                }}
                placeholder="Enter your full name"
                className={`mt-2 h-11 w-full rounded-md border bg-[#F2FFF8] px-3 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 ${
                  formErrors.fullName
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-transparent focus:border-[#9FE5BF] focus:ring-[#27AE60]/25"
                }`}
              />
              {formErrors.fullName ? (
                <span className="mt-1.5 block text-xs font-medium text-red-500">
                  {formErrors.fullName}
                </span>
              ) : null}
            </label>

            <label className="mt-5 block text-xs font-medium text-gray-700">
              Mobile Number<span className="text-red-500">*</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobileNumber}
                onChange={(event) => {
                  setMobileNumber(event.target.value.replace(/\D/g, ""));
                  setFormErrors((current) => ({ ...current, mobileNumber: "" }));
                }}
                placeholder="Enter your mobile number"
                className={`mt-2 h-11 w-full rounded-md border bg-[#F2FFF8] px-3 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 ${
                  formErrors.mobileNumber
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-transparent focus:border-[#9FE5BF] focus:ring-[#27AE60]/25"
                }`}
              />
              {formErrors.mobileNumber ? (
                <span className="mt-1.5 block text-xs font-medium text-red-500">
                  {formErrors.mobileNumber}
                </span>
              ) : null}
            </label>

            <button
              type="submit"
              className="mt-7 w-full rounded-md bg-[#27AE60] px-4 py-3 text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#219653] active:scale-[0.99]"
            >
              Apply Now
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-gray-500">
              By clicking on "Apply Now", you agree to our{" "}
              <a href="/terms" className="text-[#27AE60] underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-[#27AE60] underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#8AE6B0] text-white">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.25}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 id={titleId} className="mt-6 text-sm font-semibold text-gray-950">
              Submitted successfully
            </h3>
            <p className="mx-auto mt-2 max-w-[260px] text-[11px] leading-4 text-gray-500">
              Our Home Loan Expert will get in touch soon to discuss your offers
            </p>
            <Link
              href="/home-loans/offers"
              onClick={handleClose}
              className="mt-10 flex min-h-10 w-full items-center justify-center rounded-md bg-[#27AE60] px-6 text-xs font-medium text-white shadow-xs transition-colors hover:bg-[#219653] active:scale-[0.99]"
            >
              Explore Other Offers
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
