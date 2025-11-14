// components/tabs/AmenitiesTab.tsx
"use client";
import React from "react";
import { useFormContext } from "react-hook-form";

type BasicTabProps = {
  onNext: () => void; // 👈 receives the prop
  onBack: () => void;
};

export default function AmenitiesTab({ onNext, onBack }: BasicTabProps) {
  const { register } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div>
        <div className="flex  pt-4">
          <button type="button" onClick={onBack} className="btn btn-primary">
            Back
          </button>
        </div>
        <h1 className="font-medium text-2xl">Choose property amenities</h1>
          <br/>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <input type="checkbox" {...register("amenities.waterSupply")} />{" "}
            Water Supply
          </label>
          <label>
            <input type="checkbox" {...register("amenities.powerBackup")} />{" "}
            Power Backup
          </label>
          <label>
            <input type="checkbox" {...register("amenities.parking")} /> Parking
          </label>
          <label>
            <input type="checkbox" {...register("amenities.security")} />{" "}
            Security
          </label>
          <label>
            <input type="checkbox" {...register("amenities.gym")} /> Gym
          </label>
          <label>
            <input type="checkbox" {...register("amenities.swimmingPool")} />{" "}
            Swimming Pool
          </label>
          <label>
            <input type="checkbox" {...register("amenities.clubhouse")} />{" "}
            Clubhouse
          </label>
          <label>
            <input type="checkbox" {...register("amenities.lift")} /> Lift
          </label>
        </div>

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
