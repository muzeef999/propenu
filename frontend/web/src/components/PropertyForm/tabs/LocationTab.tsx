// components/tabs/LocationTab.tsx
"use client";
import React, { useEffect } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";

type BasicTabProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function LocationTab({ onNext, onBack }: BasicTabProps) {
  // using any for quick TS safety — consider replacing with a shared FormValues type later
  const { register, control, setValue, formState } = useFormContext<any>();
  const { errors } = formState || {};
  const address = useWatch({ control, name: "address" }) || {};

  // ensure address exists and nearbyLandmarks is an array
  useEffect(() => {
    if (!address || Object.keys(address).length === 0) {
      setValue(
        "address",
        { addressLine: "", city: "", pincode: "", nearbyLandmarks: [] },
        { shouldValidate: false, shouldDirty: false }
      );
      return;
    }

    // normalize nearbyLandmarks if needed
    const nm = address.nearbyLandmarks;
    if (nm && !Array.isArray(nm)) {
      if (typeof nm === "string") {
        const arr = nm
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        setValue("address.nearbyLandmarks", arr, { shouldDirty: true });
      } else {
        setValue("address.nearbyLandmarks", [nm], { shouldDirty: true });
      }
    }
  }, [address, setValue]);

  const nearbyLandmarks = address?.nearbyLandmarks || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="space-y-4">
        <div className="flex pt-4">
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
          {(errors?.address as any)?.addressLine && (
            <p className="text-red-500 text-sm">
              {String(
                (errors.address as any).addressLine?.message ??
                  (errors.address as any).addressLine
              )}
            </p>
          )}
        </label>

        <label>
          City (important — indexed)
          <input {...register("address.city")} className="input-field" />
          {(errors?.address as any)?.city && (
            <p className="text-red-500 text-sm">
              {String((errors.address as any).city?.message ?? (errors.address as any).city)}
            </p>
          )}
        </label>

        <label>
          Pincode
          <input {...register("address.pincode")} className="input-field" />
          {(errors?.address as any)?.pincode && (
            <p className="text-red-500 text-sm">
              {String(
                (errors.address as any).pincode?.message ?? (errors.address as any).pincode
              )}
            </p>
          )}
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
          {nearbyLandmarks?.length > 0 && (
            <p className="text-xs text-gray-500">
              Saved landmarks: {nearbyLandmarks.join(", ")}
            </p>
          )}
        </label>

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
