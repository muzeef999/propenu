"use client";

import {
  selectCityWithLocalities,
  selectLocalitiesByCity,
} from "@/Redux/slice/citySlice";
import { setAgriculturalFilter } from "@/Redux/slice/filterSlice";
import { RootState } from "@/Redux/store";
import FilterDropdown from "@/ui/FilterDropdown";
import { useDispatch, useSelector } from "react-redux";
import {
  agriculturalMoreFilterSections,
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  budgetOptions,
  CARPET_MAX,
  CARPET_MIN,
  carpetOptions,
  formatBudget,
} from "../constants/constants";
import { useRef, useState } from "react";
import { PostedByOption } from "@/types/residential";
import { Range } from "react-range";
import {
  AgriculturalFilterKey,
  MoreFilterSection,
  MoreFilterSectionAGR,
} from "@/types";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";

const AgriculturalFilters = () => {
  const dispatch = useDispatch();

  const cityData = useSelector(selectCityWithLocalities);
  const localities = useSelector(selectLocalitiesByCity);
  const filtersState = useSelector((state: RootState) => state.filters);

  const { minBudget, maxBudget, agricultural } = filtersState;

  const { locality, postedBy } = agricultural;

  /* -------------------- BUDGET -------------------- */

  const [budgetRange, setBudgetRange] = useState<[number, number]>([
    minBudget || BUDGET_MIN,
    maxBudget || BUDGET_MAX,
  ]);

  const [carpetRange, setCarpetRange] = useState<[number, number]>([
    CARPET_MIN,
    CARPET_MAX,
  ]);

  const budgetLabel =
    minBudget === BUDGET_MIN && maxBudget === BUDGET_MAX
      ? "Budget"
      : `${formatBudget(minBudget)} - ${formatBudget(maxBudget)}`;

  const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];

  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeFilter, setActiveFilter] =
    useState<AgriculturalFilterKey>("Agricultural Type");

  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleSectionClick = (key: AgriculturalFilterKey) => {
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
                        setAgriculturalFilter({
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

      <FilterDropdown
        triggerLabel={
          <span className="px-4 text-primary font-medium cursor-pointer">
            {"Total Area"}
          </span>
        }
        width="w-[320px]"
        align="left"
        renderContent={() => (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Total Area</h4>

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

      {/* ---------- MORE FILTER MODAL ---------- */}
      <FilterDropdown
        triggerLabel={
          <div className="flex text-primary items-center gap-2 px-2 py-2 rounded-full bg-white cursor-pointer">
            <span className="text-sm font-semibold text-primary">
              More Filters
            </span>
            <span className="btn-primary text-white text-xs px-2 py-0.5 rounded-full">
              {agriculturalMoreFilterSections.length}
            </span>
          </div>
        }
        width="w-[700px]"
        align="right"
        renderContent={() => (
          <div className="flex h-[420px]">
            {/* Left panel */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {agriculturalMoreFilterSections?.map((section) => (
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
            <div
              ref={rightPanelRef}
              className="flex-1 p-6 overflow-y-auto space-y-10"
            >
              {agriculturalMoreFilterSections.map((section) => (
                <div
                  key={section.key}
                  ref={(el) => {
                    sectionRefs.current[section.key] = el;
                  }}
                  className="space-y-4"
                >
                  {/* SECTION HEADING */}
                  <h3 className="text-sm font-semibold text-gray-900">
                    {section.label}
                  </h3>

                  {/* SECTION CONTENT */}
                  {section.key === "Verified Properties" ? (
                    <Toggle
                      enabled={verifiedOnly}
                      onChange={(val) => {
                        setVerifiedOnly(val);
                        toast.success(
                          val
                            ? "Verified properties enabled"
                            : "Verified properties disabled"
                        );
                      }}
                    />
                  ) : section.key === "Total Area" ? (
                    <div className="space-y-4">
                      {/* Min / Max dropdowns */}
                      <div className="flex gap-3">
                        <select
                          value={carpetRange[0]}
                          onChange={(e) =>
                            setCarpetRange([
                              Number(e.target.value),
                              carpetRange[1],
                            ])
                          }
                          className="w-1/2 border rounded-md px-3 py-2 text-sm"
                        >
                          {carpetOptions.map((v) => (
                            <option key={v} value={v}>
                              Min {v} sqft
                            </option>
                          ))}
                        </select>

                        <select
                          value={carpetRange[1]}
                          onChange={(e) =>
                            setCarpetRange([
                              carpetRange[0],
                              Number(e.target.value),
                            ])
                          }
                          className="w-1/2 border rounded-md px-3 py-2 text-sm"
                        >
                          {carpetOptions.map((v) => (
                            <option key={v} value={v}>
                              Max {v} sqft
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Range Slider */}
                      <Range
                        step={50}
                        min={CARPET_MIN}
                        max={CARPET_MAX}
                        values={carpetRange}
                        onChange={(values) =>
                          setCarpetRange(values as [number, number])
                        }
                        renderTrack={({ props, children }) => (
                          <div
                            {...props}
                            className="h-1 w-full bg-gray-200 rounded"
                          >
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

                      <div className="text-xs text-gray-500">
                        {carpetRange[0]} – {carpetRange[1]} sqft
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {section.options?.map((opt) => (
                        <button
                          key={opt}
                          className="px-3 py-1.5 rounded-full border text-sm hover:bg-gray-100"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default AgriculturalFilters;
