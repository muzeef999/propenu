"use client";
import React from "react";
import clsx from "clsx";
import { UseFormRegisterReturn } from "react-hook-form";

type ToggleGroupProps = {
  label?: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange?: (val: string) => void;
  register?: UseFormRegisterReturn; // for react-hook-form integration
};

export default function ToggleGroup({
  label,
  options,
  value,
  onChange,
  register,
}: ToggleGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="flex gap-3">
        {options.map((opt) => {
          const isActive = value === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange?.(opt.value);
                if (register) {
                  const event = {
                    target: { value: opt.value, name: register.name },
                  };
                  register.onChange(event as any);
                }
              }}
              className={clsx(
                "px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border-gray-300 text-gray-600 hover:border-[var(--color-primary)]/60 hover:text-[var(--color-primary)]"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
