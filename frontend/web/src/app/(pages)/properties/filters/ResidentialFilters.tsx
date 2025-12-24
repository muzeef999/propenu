"use client";

import React, { useEffect, useState } from "react";
import { Range } from "react-range";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/Redux/store";
import {
  setBhk,
  setBudget,
  setLocality,
  setPostedBy,
} from "@/Redux/slice/filterSlice";
import FilterDropdown from "@/ui/FilterDropdown";
import { BHKOption, PostedByOption } from "@/types/residential";
import { buildSearchParams } from "./buildSearchParams";
import { searchFilter } from "@/data/ClientData";
import {
  selectCityWithLocalities,
  selectLocalitiesByCity,
} from "@/Redux/slice/citySlice";
import { setCity } from "@/components/CityHydrator";

/* -------------------- BUDGET CONSTANTS -------------------- */

const BUDGET_MIN = 5; // 5 Lac
const BUDGET_MAX = 5000; // 50 Cr (in Lac)
const BUDGET_STEP = 5;

const budgetOptions = [
  5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 2000, 3000,
  4000, 5000,
];

const formatBudget = (value: number) => {
  if (value >= 100) return `₹${value / 100}${value === 5000 ? "+" : ""} Cr`;
  return `₹${value} Lac`;
};

/* -------------------- COMPONENT -------------------- */

const ResidentialFilters = () => {
  const dispatch = useDispatch();

  const cityData = useSelector(selectCityWithLocalities);

  // 🔥 Only localities
  const localities = useSelector(selectLocalitiesByCity);

  console.log("Derived selected city:", cityData);
  console.log("📍 Derived localities:", localities);

  const filters = useSelector((state: RootState) => state.filters);

  const { locality, bhk, minBudget, maxBudget, postedBy } = filters;

  /* -------------------- BHK -------------------- */

  const bhkOptions: BHKOption[] = [
    "1 BHK",
    "2 BHK",
    "3 BHK",
    "4 BHK",
    "5 BHK",
    "6 BHK",
    "6+ BHK",
  ];

  const getBhkNumber = (bhk: BHKOption): number =>
    bhk === "6+ BHK" ? 6 : Number(bhk.split(" ")[0]);

  const bhkLabel = bhk ? `${bhk}${bhk === 6 ? "+" : ""} BHK` : "BHK";

  /* -------------------- BUDGET -------------------- */

  const [values, setValues] = useState<[number, number]>([
    minBudget,
    maxBudget,
  ]);

  const budgetLabel =
    minBudget === BUDGET_MIN && maxBudget === BUDGET_MAX
      ? "Budget"
      : `${formatBudget(minBudget)} - ${formatBudget(maxBudget)}`;

  const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];

  useEffect(() => {
    const params = buildSearchParams(filters);
    searchFilter(params);
  }, [filters]);

  return (
    <div className="flex gap-4">
      {/* ==================== Top Localities ==================== */}

      <FilterDropdown
        triggerLabel={
          <span className="px-4 text-primary font-medium">
            {locality || "Select Locality"}
          </span>
        }
        width="w-86"
        align="left"
        openOnHover
        renderContent={(close) => (
          <div className="p-2">
            {/* Header */}
            <h4 className="text-sm font-semibold mb-2">
              {cityData
                ? `Localities in ${cityData.city}`
                : "Select city first"}
            </h4>

            {/* No city selected */}
            {!cityData && (
              <p className="text-sm text-gray-400">
                Please select a city to see localities
              </p>
            )}

            {/* Localities list */}
            {cityData && (
              <div className="flex gap-2 flex-wrap">
                {localities.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      // dispatch(setLocality(loc.name));
                      close?.();
                    }}
                    className={`px-2 py-1 rounded text-sm hover:bg-gray-100 ${
                      locality === loc.name ? "font-semibold bg-gray-100" : ""
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      />

      {/* ==================== BHK FILTER ==================== */}
      <FilterDropdown
        triggerLabel={
          <span className="px-4 text-primary font-medium">{bhkLabel}</span>
        }
        width="w-86"
        align="left"
        openOnHover
        renderContent={(close?: () => void) => (
          <div>
            <h4 className="text-sm font-semibold mb-2">BHK Type</h4>

            <div className="flex gap-2 flex-wrap">
              {bhkOptions.map((option) => {
                const value = getBhkNumber(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      dispatch(setBhk(value));
                      close?.();
                    }}
                    className={`px-2 py-1 rounded hover:bg-gray-100 ${
                      bhk === value ? "font-semibold bg-gray-100" : ""
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      />

      {/* ==================== BUDGET FILTER ==================== */}
      <FilterDropdown
        triggerLabel={
          <span className="px-4 font-medium text-primary">{budgetLabel}</span>
        }
        width="w-[420px]"
        align="left"
        renderContent={(close?: () => void) => (
          <div className="p-4 space-y-5">
            {/* MIN / MAX SELECT */}
            <div className="flex gap-3">
              {/* MIN */}
              <select
                value={values[0]}
                onChange={(e) => {
                  const min = Number(e.target.value);
                  setValues([min, Math.max(min, values[1])]);
                }}
                className="w-1/2 border rounded px-3 py-2 text-sm"
              >
                {budgetOptions
                  .filter((v) => v <= 400)
                  .map((v) => (
                    <option key={v} value={v}>
                      {formatBudget(v)}
                    </option>
                  ))}
              </select>

              {/* MAX */}
              <select
                value={values[1]}
                onChange={(e) => {
                  const max = Number(e.target.value);
                  setValues([Math.min(values[0], max), max]);
                }}
                className="w-1/2 border rounded px-3 py-2 text-sm"
              >
                {budgetOptions.map((v) => (
                  <option key={v} value={v}>
                    {formatBudget(v)}
                  </option>
                ))}
              </select>
            </div>

            {/* SLIDER */}
            <Range
              values={values}
              step={BUDGET_STEP}
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              onChange={(vals) => setValues(vals as [number, number])}
              renderTrack={({ props, children }) => {
                const { key, ...restProps } = props as any;

                return (
                  <div
                    key={key}
                    {...restProps}
                    className="h-1 w-full bg-gray-200 rounded"
                  >
                    {children}
                  </div>
                );
              }}
              renderThumb={({ props }) => {
                const { key, ...restProps } = props as any;

                return (
                  <div
                    key={key}
                    {...restProps}
                    className="h-5 w-5 bg-white border-2 border-primary rounded-full shadow"
                  />
                );
              }}
            />

            {/* SCALE */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatBudget(BUDGET_MIN)}</span>
              <span>{formatBudget(BUDGET_MAX)}</span>
            </div>
          </div>
        )}
      />

      {/* ==================== Posted By ==================== */}
      <FilterDropdown
        triggerLabel={
          <span className="px-4 font-medium text-primary">Posted By</span>
        }
        width="w-56"
        align="left"
        openOnHover
        renderContent={(close?: () => void) => (
          <div>
            <h4 className="text-sm font-semibold mb-2">Posted By</h4>
            <div className="flex flex-col gap-2">
              {postedByOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    dispatch(setPostedBy(option));
                    close?.();
                  }}
                  className={`px-2 py-1 rounded hover:bg-gray-100 ${
                    postedBy === option ? "font-semibold bg-gray-100" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default ResidentialFilters;
