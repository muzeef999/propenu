// components/tabs/PriceTab.tsx
"use client";
import React from "react";
import { useFormContext } from "react-hook-form";

type BasicTabProps = {
  onNext: () => void; // 👈 receives the prop
  onBack: () => void;
};

export default function PriceTab({ onNext, onBack }: BasicTabProps) {
  const { register } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="space-y-4">
        <div className="flex  pt-4">
          <button type="button" onClick={onBack} className="btn btn-primary">
            Back
          </button>
        </div>
        <h1 className="font-medium text-2xl">Pricing & property details</h1>
        <label>
          Price
          <input
            type="number"
            {...register("price", { valueAsNumber: true })}
            className="input-field"
          />
        </label>

        <label>
          Area (sq ft)
          <input
            type="number"
            {...register("area", { valueAsNumber: true })}
            className="input-field"
          />
        </label>

        <label>
          Facing
          <input {...register("facing")} className="input-field" />
        </label>

        {/* Category specific: Residential example using details.bhk */}
        <label>
          BHK (Residential)
          <input
            type="number"
            {...register("details.bhk", { valueAsNumber: true })}
            className="input-field"
          />
        </label>

        <label>
          Bathrooms
          <input
            type="number"
            {...register("details.bathrooms", { valueAsNumber: true })}
            className="input-field"
          />
        </label>

        {/* Commercial example */}
        <label>
          Floor (Commercial)
          <input
            type="number"
            {...register("details.floor", { valueAsNumber: true })}
            className="input-field"
          />
        </label>

        <label>
          Property type (Commercial)
          <input
            {...register("details.propertyType")}
            className="input-field"
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
