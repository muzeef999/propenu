"use client";

import React from "react";
import { IAmenity } from "@/types/residential";
import { ICreatePropertyFormState } from "../types";
import AmenitiesSelect from "@/app/(pages)/postproperty/profile/AmenitiesSelect";
import { AMENITIES_FOR_FEATURED_PROJECT } from "@/app/(pages)/postproperty/constants/amenities";


interface Step4AmenitiesProps {
  data: ICreatePropertyFormState;
  onUpdate: <K extends keyof ICreatePropertyFormState>(
    field: K,
    value: ICreatePropertyFormState[K]
  ) => void;
  errors: string[];
}

export const Step4Amenities: React.FC<Step4AmenitiesProps> = ({
  data,
  onUpdate,
  errors = [],
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Amenities
        </h2>
        <p className="text-sm text-gray-600">
          Select amenities available in this property
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <ul className="space-y-1 text-sm text-red-700">
            {errors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Amenities Select */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <AmenitiesSelect
          label="Amenities"
          options={AMENITIES_FOR_FEATURED_PROJECT}
          value={data.amenities || []}
          onChange={(value: IAmenity[]) =>
            onUpdate("amenities", value)
          }
          error={errors.length ? "Please select at least one amenity" : undefined}
        />
      </div>
    </div>
  );
};
