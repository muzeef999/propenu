"use client";
import FilterDropdown from "@/ui/FilterDropdown";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/Redux/store";
import {
  selectCityWithLocalities,
  selectLocalitiesByCity,
} from "@/Redux/slice/citySlice";
import { setCommercialFilter } from "@/Redux/slice/filterSlice";
import React, { useRef, useState } from "react";
import { formatBudget } from "../constants/budget";
import { Range } from "react-range";
import { PostedByOption } from "@/types/residential";
import { COMFilterKey, MoreFilterSection } from "@/types";

const BUDGET_MIN = 5;
const BUDGET_MAX = 5000;
const BUDGET_STEP = 5;

const budgetOptions = [
  5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 2000, 3000,
  4000, 5000,
];

const CommercialFilters = () => {
  const dispatch = useDispatch();


    const rightPanelRef = useRef<HTMLDivElement | null>(null);
      const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
    

      const [activeFilter, setActiveFilter] =
        useState<COMFilterKey>("Sub Property Type");
    
  

  const cityData = useSelector(selectCityWithLocalities);
  const localities = useSelector(selectLocalitiesByCity);
  const filtersState = useSelector((state: RootState) => state.filters);

  const { minBudget, maxBudget, commercial } = filtersState;

  const { locality, postedBy } = commercial;

  const [budgetRange, setBudgetRange] = useState<[number, number]>([
    minBudget || BUDGET_MIN,
    maxBudget || BUDGET_MAX,
  ]);

  const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];

  const budgetLabel =
    minBudget === BUDGET_MIN && maxBudget === BUDGET_MAX
      ? "Budget"
      : `${formatBudget(minBudget)} - ${formatBudget(maxBudget)}`;


      const handleSectionClick = (key: COMFilterKey) => {
          const container = rightPanelRef.current;
          const target = sectionRefs.current[key];
      
          if (!container || !target) return;
      
          const top = target.offsetTop - container.offsetTop - 12;
      
          container.scrollTo({
            top,
            behavior: "smooth",
          });
      
          setActiveFilter(key);
        };

  const moreFilterSections: MoreFilterSection[] = [
    {
      key: "Sub Property Type",
      label: "Sub Property Type",
      options: [
        "Apartment",
        "Independent house",
        "Villa",
        "Penthouse",
        "Studio",
        "Duplex",
        "Triplex",
        "Farmhouse",
        "independent-builder-floor",
      ],
    },
    { key: "Sales Type", label: "Sales Type", options: ["new-sale", "resale"] },
    {
      key: "Possession Status",
      label: "Possession Status",
      options: ["ready-to-move", "under-construction"],
    },
    { key: "Covered Area", label: "Covered Area" },
    { key: "Bathroom", label: "Bathroom", options: ["1+", "2+", "3+", "4+"] },
    { key: "Balcony", label: "Balcony", options: ["1+", "2+", "3+"] },
    {
      key: "Parking",
      label: "Parking",
      options: ["No Parking", "1 Car", "2 Cars"],
    },
    {
      key: "Furnishing",
      label: "Furnishing",
      options: ["Unfurnished", "Semi-Furnished", "Fully Furnished"],
    },
    {
      key: "Amenities",
      label: "Amenities",
      options: ["Lift", "Power Backup", "Gym", "Swimming Pool", "Security"],
    },
    {
      key: "Facing",
      label: "Facing",
      options: ["East", "West", "North", "South"],
    },
    { key: "Verified Properties", label: "Verified Properties" },
    {
      key: "Posted Since",
      label: "Posted Since",
      options: [
        "All",
        "Yesterday",
        "Last Week",
        "Last 2 Weeks",
        "Last 3 Weeks",
        "Last Month",
        "Last 2 Months",
        "Last 4 Months",
      ],
    },
    {
      key: "Posted By",
      label: "Posted By",
      options: ["owners", "Agents", "Builders"],
    },
  ];

  return (
    <div className="flex gap-4 items-center">
      {/* ---------- Localities ---------- */}
      <FilterDropdown
        triggerLabel={
          <span className="px-4 text-primary font-medium cursor-pointer">
            {locality || "Select Locality"}
          </span>
        }
        width="w-86"
        align="left"
        renderContent={(close) => (
          <div className="p-2">
            <h4 className="text-sm font-semibold mb-2">
              {cityData
                ? `Localities in ${cityData.city}`
                : "Select city first"}
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
                      dispatch(
                        setCommercialFilter({
                          key: "locality",
                          value: loc.name,
                        })
                      );

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

      {/* ---------- Budget ---------- */}
      <FilterDropdown
        triggerLabel={
          <span className="px-4 text-primary font-medium cursor-pointer">
            {budgetLabel}
          </span>
        }
        width="w-[320px]"
        align="left"
        renderContent={() => (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Budget</h4>

            {/* Min / Max dropdowns */}
            <div className="flex gap-3">
              <select
                value={budgetRange[0]}
                onChange={(e) =>
                  setBudgetRange([Number(e.target.value), budgetRange[1]])
                }
                className="w-1/2 border rounded-md px-3 py-2 text-sm"
              >
                {budgetOptions.map((v) => (
                  <option key={v} value={v}>
                    Min {formatBudget(v)}
                  </option>
                ))}
              </select>

              <select
                value={budgetRange[1]}
                onChange={(e) =>
                  setBudgetRange([budgetRange[0], Number(e.target.value)])
                }
                className="w-1/2 border rounded-md px-3 py-2 text-sm"
              >
                {budgetOptions.map((v) => (
                  <option key={v} value={v}>
                    Max {formatBudget(v)}
                  </option>
                ))}
              </select>
            </div>

            {/* Range Slider */}
            <Range
              step={BUDGET_STEP}
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              values={budgetRange}
              onChange={(values) => setBudgetRange(values as [number, number])}
              renderTrack={({ props, children }) => (
                <div {...props} className="h-1 w-full bg-gray-200 rounded">
                  {children}
                </div>
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  className="h-4 w-4 bg-green-600 rounded-full shadow"
                />
              )}
            />

            {/* Label */}
            <div className="text-xs text-gray-500 text-center">
              {formatBudget(budgetRange[0])} – {formatBudget(budgetRange[1])}
            </div>
          </div>
        )}
      />

      {/* ---------- Posted By ---------- */}
      <FilterDropdown
        triggerLabel={
          <span className="px-4 font-medium text-primary cursor-pointer">
            Posted By
          </span>
        }
        width="w-56"
        renderContent={(close) => (
          <div>
            <h4 className="text-sm font-semibold mb-2">Posted By</h4>
            {postedByOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  dispatch(
                    setCommercialFilter({
                      key: "postedBy",
                      value: opt,
                    })
                  );
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

      <FilterDropdown
        triggerLabel={
          <div className="flex text-primary items-center gap-2 px-2 py-2 rounded-full bg-white cursor-pointer">
            <span className="text-sm font-semibold text-primary">
              More Filters
            </span>
            <span className="btn-primary text-white text-xs px-2 py-0.5 rounded-full">
              {moreFilterSections.length}
            </span>
          </div>
        }
        width="w-[700px]"
        align="right"
        renderContent={() => (
          <div className="flex h-[420px]">
            {/* Left panel */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {moreFilterSections?.map((section) => (
                <button
                  key={section.key}
                  onClick={() => {
                    handleSectionClick(section.key);
                    setActiveFilter(section.key);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200   ${
                    activeFilter === section.key
                      ? " font-semibold text-primary"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {/* Right panel */}
            {/* Right panel */}
    
          </div>
        )}
      />
    </div>
  );
};

export default CommercialFilters;
