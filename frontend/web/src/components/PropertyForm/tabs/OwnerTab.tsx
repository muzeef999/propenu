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
          <input {...register("createdBy")} className="input" />
        </label>

        <label>
          Created By Role
          <select {...register("createdByRole")} className="input">
            <option value="builder">Builder</option>
            <option value="agent">Agent</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label>
          Builder (ref id)
          <input {...register("builder")} className="input" />
        </label>
        <label>
          Agent (ref id)
          <input {...register("agent")} className="input" />
        </label>
        <label>
          Seller (ref id)
          <input {...register("seller")} className="input" />
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
