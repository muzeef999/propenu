// components/tabs/LocationTab.tsx
"use client";
import React from "react";
import { useFormContext, Controller } from "react-hook-form";

type BasicTabProps = {
  onNext: () => void; // 👈 receives the prop
  onBack: () =>  void;
};


export default function LocationTab({ onNext, onBack }: BasicTabProps) {
  const { register, control } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="space-y-4">
        <div className="flex  pt-4">
          <button type="button" onClick={onBack} className="btn btn-primary">
            Back
          </button>
        </div>
        <h1 className="font-medium text-2xl">
          Where is your property located ?
        </h1>
        <label>
          Address line
          <input {...register("address.addressLine")} className="input-field" />
        </label>

        <label>
          City (important — indexed)
          <input {...register("address.city")} className="input-field" />
        </label>

        <label>
          Pincode
          <input {...register("address.pincode")} className="input-field" />
        </label>

        <label>
          Nearby landmarks (comma separated)
          <Controller
            name="address.nearbyLandmarks"
            control={control}
            render={({ field }) => (
              <input
                value={(field.value || []).join(", ")}
                onChange={(e) =>
                  field.onChange(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                className="input"
              />
            )}
          />
        </label>
        {/* ✅ NEXT button at bottom */}
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onNext} className="btn btn-primary">
            Continue →
          </button>
        </div>
      </div>
      <div className="hidden md:flex items-center justify-center">
        <h1>Knowleadge guide details propority</h1>
      </div>
    </div>
  );
}
