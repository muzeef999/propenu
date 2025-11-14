// components/tabs/OwnerTab.tsx
"use client";
import React from "react";
import { useFormContext } from "react-hook-form";

type BasicTabProps = {
  onBack: () => void;
  onPublish: () => void;
};

export default function OwnerTab({ onBack, onPublish }: BasicTabProps) {
  const { register } = useFormContext();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="space-y-3">
        <div className="flex  pt-4">
          <button type="button" onClick={onBack} className="btn btn-primary">
            Back
          </button>
        </div>
        <h1 className="font-medium text-2xl">Owner & Publish info</h1>
        <br />
        <label>
          Created By (userId)
          <input {...register("userId")} className="input-field" />
        </label>

        <button type="button" onClick={onPublish} className="btn btn-primary">
          Publish →
        </button>
      </div>

      <div className="hidden md:flex items-center justify-center">
        <h1>Knowleadge guide details propority</h1>
      </div>
    </div>
  );
}
