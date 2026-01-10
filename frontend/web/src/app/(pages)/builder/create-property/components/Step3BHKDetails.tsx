"use client";

import React, { useState } from "react";
import { IBhkSummary, ICreatePropertyFormState, IUnit } from "../types";
import InputField from "@/ui/InputField";
import CounterField from "@/ui/CounterField";

interface Step3BHKDetailsProps {
  data: ICreatePropertyFormState;
  onUpdate: <K extends keyof ICreatePropertyFormState>(
    field: K,
    value: ICreatePropertyFormState[K]
  ) => void;
  errors: string[];
}

export const Step3BHKDetails: React.FC<Step3BHKDetailsProps> = ({
  data,
  onUpdate,
  errors = [],
}) => {
  const [newBhk, setNewBhk] = useState<IBhkSummary>({
    bhk: 1,
    bhkLabel: "",
    units: [],
  });

  /* -------------------- BHK HANDLERS -------------------- */

  const addBhk = () => {
    const updated = [...(data.bhkSummary || []), newBhk];
    onUpdate("bhkSummary", updated);
    setNewBhk({ bhk: 1, bhkLabel: "", units: [] });
  };

  const removeBhk = (index: number) => {
    const updated = (data.bhkSummary || []).filter((_, i) => i !== index);
    onUpdate("bhkSummary", updated);
  };

  /* -------------------- UNIT HANDLERS -------------------- */

  const addUnit = (bhkIndex: number) => {
    const updated = [...(data.bhkSummary || [])];
    const newUnit: IUnit = {
      minSqft: undefined,
      maxPrice: undefined,
      availableCount: 0,
    };

    if (!updated[bhkIndex].units) updated[bhkIndex].units = [];
    updated[bhkIndex].units!.push(newUnit);
    onUpdate("bhkSummary", updated);
  };

  const updateUnit = (
    bhkIndex: number,
    unitIndex: number,
    field: keyof IUnit,
    value: number
  ) => {
    const updated = [...(data.bhkSummary || [])];

    updated[bhkIndex].units![unitIndex] = {
      ...updated[bhkIndex].units![unitIndex],
      [field]: value,
    };

    onUpdate("bhkSummary", updated);
  };

  const removeUnit = (bhkIndex: number, unitIndex: number) => {
    const updated = [...(data.bhkSummary || [])];
    updated[bhkIndex].units = updated[bhkIndex].units!.filter(
      (_, i) => i !== unitIndex
    );
    onUpdate("bhkSummary", updated);
  };

  /* -------------------- UI -------------------- */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          BHK Configuration
        </h2>
        <p className="text-sm text-gray-600">
          Define apartment types, sizes, pricing, and availability
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

      {/* Add BHK */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-emerald-900">
          Add New BHK Type
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CounterField
            label="BHK Type"
            value={newBhk.bhk}
            min={1}
            required
            onChange={(value) => setNewBhk({ ...newBhk, bhk: value })}
          />

          <InputField
            label="Label"
            placeholder="2BHK Premium"
            value={newBhk.bhkLabel || ""}
            onChange={(value) => setNewBhk({ ...newBhk, bhkLabel: value })}
          />
        </div>

        <button onClick={addBhk} className="w-full text-white btn-primary">
          + Add BHK Type
        </button>
      </div>

      {/* Existing BHKs */}
      <div className="space-y-6">
        {data.bhkSummary?.map((bhk, bhkIndex) => (
          <div
            key={bhkIndex}
            className="rounded-xl border border-gray-200 bg-white p-6 space-y-4"
          >
            {/* BHK Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {bhk.bhkLabel || `${bhk.bhk} BHK`}
                </h3>
                <p className="text-xs text-gray-500">
                  {bhk.units?.length || 0} unit variations
                </p>
              </div>

              <button
                onClick={() => removeBhk(bhkIndex)}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>

            {/* Units */}
            <div className="space-y-3">
              {bhk.units?.map((unit, unitIndex) => (
                <div
                  key={unitIndex}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                      label="Min Sqft"
                      type="number"
                      value={unit.minSqft || ""}
                      onChange={(v) =>
                        updateUnit(bhkIndex, unitIndex, "minSqft", Number(v))
                      }
                    />

                    <InputField
                      label="Max Price"
                      type="number"
                      value={unit.maxPrice || ""}
                      onChange={(v) =>
                        updateUnit(bhkIndex, unitIndex, "maxPrice", Number(v))
                      }
                    />

                    <InputField
                      label="Available Units"
                      type="number"
                      min={0}
                      value={unit.availableCount ?? ""}
                      onChange={(v) =>
                        updateUnit(
                          bhkIndex,
                          unitIndex,
                          "availableCount",
                          v === "" ? 0 : Math.max(0, Number(v))
                        )
                      }
                    />
                  </div>

                  <button
                    onClick={() => removeUnit(bhkIndex, unitIndex)}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove unit
                  </button>
                </div>
              ))}
            </div>

            {/* Add Unit */}
            <button
              onClick={() => addUnit(bhkIndex)}
              className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              + Add Unit Variation
            </button>
          </div>
        ))}
      </div>

      {/* Sqft Range */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Overall Sqft Range
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Minimum Sqft"
            type="number"
            value={data.sqftRange?.min || ""}
            onChange={(v) =>
              onUpdate("sqftRange", {
                ...data.sqftRange,
                min: Number(v),
              })
            }
          />

          <InputField
            label="Maximum Sqft"
            type="number"
            value={data.sqftRange?.max || ""}
            onChange={(v) =>
              onUpdate("sqftRange", {
                ...data.sqftRange,
                max: Number(v),
              })
            }
          />
        </div>
      </div>
    </div>
  );
};
