"use client";

import React from "react";

type TrackPropertyStatusProps = {
  isApproved: boolean;
  submittedAt?: string;
  reviewAt?: string;
  approvedAt?: string;
  onGoToMyProperties: () => void;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const TrackPropertyStatus: React.FC<TrackPropertyStatusProps> = ({
  isApproved,
  submittedAt,
  reviewAt,
  approvedAt,
  onGoToMyProperties,
}) => {
  const steps = [
    { id: 1, label: "Submitted", date: submittedAt, active: true },
    { id: 2, label: "Under Review", date: reviewAt, active: true }, // Assuming step 2 is always reached if viewing this
    { id: 3, label: "Approved & Live", date: approvedAt, active: isApproved },
  ];

  return (
    <div className="max-w-4xl font-sans p-6">
      <p className="text-[#666D80] mb-12">
        Check the current status of your property submission
      </p>

      <div className="w-[90%] mx-auto">
        {/* Circles + Lines */}
        <div className="grid grid-cols-3 items-center w-full">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center justify-center relative">

              {/* Left line */}
              {index !== 0 && (
                <div
                  className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 border-t-2 border-dashed ${step.active ? "border-[#27AE60]" : "border-[#BDBDBD]"
                    }`}
                />
              )}

              {/* Right line */}
              {index !== steps.length - 1 && (
                <div
                  className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed ${steps[index + 1].active
                      ? "border-[#27AE60]"
                      : "border-[#BDBDBD]"
                    }`}
                />
              )}

              {/* Circle */}
              <div
                className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm border-2 ${step.active
                    ? "bg-[#27AE60] border-[#27AE60] text-white"
                    : "bg-white border-[#27AE60] text-[#27AE60]"
                  }`}
              >
                {step.id}
              </div>
            </div>
          ))}
        </div>

        {/* Labels */}
        <div className="mt-4 grid grid-cols-3 text-center">
          {steps.map((step) => (
            <div key={`label-${step.id}`}>
              <p
                className={`text-lg font-semibold ${step.active ? "text-[#27AE60]" : "text-[#BDBDBD]"
                  }`}
              >
                {step.label}
              </p>

              <p
                className={`mt-1 text-xs font-medium ${step.active ? "text-[#27AE60]" : "text-transparent"
                  }`}
              >
                {formatDate(step.date) || "\u00A0"}
              </p>
            </div>
          ))}
        </div>
      </div>


      <p className="mt-12 text-sm text-[#828282] leading-relaxed max-w-2xl">
        Your property has been submitted for review; you'll be notified within 24
        hours via Email, WhatsApp, and SMS once it's approved or if any action is
        required.
      </p>

      <button
        type="button"
        onClick={onGoToMyProperties}
        className="mt-8 rounded-lg bg-[#27AE60] px-8 py-3 text-sm font-semibold text-white hover:bg-[#219150] transition-colors"
      >
        Go to My Properties
      </button>
    </div>
  );
};

export default TrackPropertyStatus;
