"use client";

import React, { useEffect, useState } from "react";
import { Range } from "react-range";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/Redux/store";
import {
  setBhk,
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
import { RESFilterKey } from "@/types";

/* -------------------- BUDGET CONSTANTS -------------------- */

const BUDGET_MIN = 5;
const BUDGET_MAX = 5000;
const BUDGET_STEP = 5;

const budgetOptions = [
  5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500,
  750, 1000, 2000, 3000, 4000, 5000,
];

const formatBudget = (value: number) =>
  value >= 100 ? `₹${value / 100}${value === 5000 ? "+" : ""} Cr` : `₹${value} Lac`;

/* -------------------- COMPONENT -------------------- */

const ResidentialFilters = () => {
  const dispatch = useDispatch();

  const cityData = useSelector(selectCityWithLocalities);
  const localities = useSelector(selectLocalitiesByCity);
  const filtersState = useSelector((state: RootState) => state.filters);

  const { locality, bhk, minBudget, maxBudget, postedBy } = filtersState;

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RESFilterKey>("furnishing");

  /* -------------------- BHK -------------------- */

  const bhkOptions: BHKOption[] = [
    "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "6 BHK", "6+ BHK",
  ];

  const getBhkNumber = (b: BHKOption) =>
    b === "6+ BHK" ? 6 : Number(b.split(" ")[0]);

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
    searchFilter(buildSearchParams(filtersState));
  }, [filtersState]);

  /* -------------------- MORE FILTER CONFIG -------------------- */

  const moreFiltersConfig: { key: RESFilterKey; label: string }[] = [
    { key: "furnishing", label: "Furnishing" },
    { key: "amenities", label: "Amenities" },
    { key: "photos", label: "Photos & Videos" },
    { key: "facing", label: "Facing" },
    { key: "floor", label: "Floor" },
    { key: "bathroom", label: "Bathroom" },
    { key: "localities", label: "Properties in Localities" },
  ];

  return (
    <>
      {/* ==================== FILTER BAR ==================== */}
      <div className="flex gap-4 items-center">

        {/* ---------- Localities ---------- */}
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
              <h4 className="text-sm font-semibold mb-2">
                {cityData ? `Localities in ${cityData.city}` : "Select city first"}
              </h4>

              {!cityData && (
                <p className="text-sm text-gray-400">
                  Please select a city to see localities
                </p>
              )}

              {cityData && (
                <div className="flex gap-2 flex-wrap">
                  {localities.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        dispatch(setLocality(loc.name));
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

        {/* ---------- BHK ---------- */}
        <FilterDropdown
          triggerLabel={<span className="px-4 text-primary font-medium">{bhkLabel}</span>}
          width="w-86"
          openOnHover
          renderContent={(close) => (
            <div>
              <h4 className="text-sm font-semibold mb-2">BHK Type</h4>
              <div className="flex gap-2 flex-wrap">
                {bhkOptions.map((opt) => {
                  const value = getBhkNumber(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        dispatch(setBhk(value));
                        close?.();
                      }}
                      className={`px-2 py-1 rounded hover:bg-gray-100 ${
                        bhk === value ? "font-semibold bg-gray-100" : ""
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        />

        {/* ---------- Posted By ---------- */}
        <FilterDropdown
          triggerLabel={<span className="px-4 font-medium text-primary">Posted By</span>}
          width="w-56"
          openOnHover
          renderContent={(close) => (
            <div>
              <h4 className="text-sm font-semibold mb-2">Posted By</h4>
              {postedByOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    dispatch(setPostedBy(opt));
                    close?.();
                  }}
                  className={`px-2 py-1 rounded block w-full text-left hover:bg-gray-100 ${
                    postedBy === opt ? "font-semibold bg-gray-100" : ""
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        />

        {/* ---------- MORE FILTERS ---------- */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white"
        >
          <span className="font-medium">More Filters</span>
          <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
            {moreFiltersConfig.length}
          </span>
        </button>
      </div>

      {/* ==================== MORE FILTER MODAL ==================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[90vw] h-[85vh] rounded-xl flex overflow-hidden">

            {/* Left panel */}
            <div className="w-1/3 border-r overflow-y-auto">
              {moreFiltersConfig.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`w-full text-left px-4 py-3 ${
                    activeFilter === f.key
                      ? "bg-gray-100 font-semibold"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Right panel */}
            <div className="flex-1 p-6">
              <h3 className="text-lg font-semibold capitalize">{activeFilter}</h3>
              <p className="text-sm text-gray-500 mt-2">
                Content for {activeFilter} goes here
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResidentialFilters;
