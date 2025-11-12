// components/StepperHeader.tsx
"use client";
import React from "react";
import clsx from "clsx";

type Step = { key: string; label: string };

export default function StepperHeader({
  steps,
  current,
  completed,
  onClick,
}: {
  steps: Step[];
  current: number;
  completed: boolean[];
  onClick: (i: number) => void;
}) {
  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between relative">
        {steps.map((s, i) => {
          const done = completed[i];
          const active = i === current;

          return (
            <div
              key={s.key}
              className="flex-1 flex flex-col items-center relative"
            >
              {/* --- connector line between circles --- */}
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    "absolute top-4 left-1/2 w-full h-[2px] -translate-x-[0%] transition-colors duration-300",
                    completed[i] ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}

              {/* --- step circle --- */}
              <button
                type="button"
                onClick={() => onClick(i)}
                disabled={i > current && !completed.slice(0, i).every(Boolean)}
                aria-current={active ? "step" : undefined}
                className="relative z-10"
              >
                <div
                  className={clsx(
                    "flex items-center justify-center w-8 h-8 rounded-full border text-xs font-medium transition-all",
                    done
                      ? "bg-green-500 border-green-500 text-white"
                      : active
                      ? "border-primary text-primary bg-white"
                      : "border-gray-300 text-gray-500 bg-white"
                  )}
                >
                  {done ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
              </button>

              {/* --- step label --- */}
              <div
                className={clsx(
                  "mt-2 text-xs text-center whitespace-nowrap",
                  active ? "text-primary font-semibold" : "text-gray-500"
                )}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
