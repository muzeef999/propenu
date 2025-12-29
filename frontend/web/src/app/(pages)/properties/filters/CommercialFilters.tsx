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
import {
  commercialMoreFilterSections,
  formatBudget,
} from "../constants/constants";
import { Range } from "react-range";
import { PostedByOption } from "@/types/residential";
import { CommercialFilterKey, MoreFilterSectionCom } from "@/types";
import { ArrowDropdownIcon } from "@/icons/icons";
import { getSelectedMoreFiltersCount } from "../count-helper/ResSelectedMoreFiltersCount";
import { commercialKeyMapping } from "@/types/commercial";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";
import SelectableButton from "@/ui/SelectableButton";

const BUDGET_MIN = 5;
const BUDGET_MAX = 5000;
const BUDGET_STEP = 5;

const CARPET_MIN = 100;
const CARPET_MAX = 10000;

const budgetOptions = [
  5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 2000, 3000,
  4000, 5000,
];

const carpetOptions = [
  100, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000,
];

const CommercialFilters = () => {
  const dispatch = useDispatch();

  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] =
    useState<CommercialFilterKey>("Commercial Type");

  const cityData = useSelector(selectCityWithLocalities);
  const localities = useSelector(selectLocalitiesByCity);
  const filtersState = useSelector((state: RootState) => state.filters);

  const { minBudget, maxBudget, commercial } = filtersState;

  const { locality, postedBy } = commercial;

  const [budgetRange, setBudgetRange] = useState<[number, number]>([
    minBudget || BUDGET_MIN,
    maxBudget || BUDGET_MAX,
  ]);

  const [carpetRange, setCarpetRange] = useState<[number, number]>([
    CARPET_MIN,
    CARPET_MAX,
  ]);

  const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];

  const budgetLabel =
    minBudget === BUDGET_MIN && maxBudget === BUDGET_MAX
      ? "Budget"
      : `${formatBudget(minBudget)} - ${formatBudget(maxBudget)}`;

  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleSectionClick = (key: CommercialFilterKey) => {
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

  const toggleArrayValue = (arr: string[] = [], value: string) => {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  };

  const selectedMoreFiltersCount = getSelectedMoreFiltersCount(
    commercial,
    commercialKeyMapping
  );
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

      <FilterDropdown
        triggerLabel={
          <span className="px-4 text-primary font-medium cursor-pointer">
            {"Area"}
          </span>
        }
        width="w-[320px]"
        align="left"
        renderContent={() => (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Area</h4>

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
                  Array.isArray(postedBy) ? postedBy.includes(opt) ? "font-semibold bg-gray-100" : "" : postedBy === opt ? "font-semibold bg-gray-100" : ""
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      />

      {/* ---------- MORE FILTER MODAL ---------- */}
      <FilterDropdown
        open={open}
        onOpenChange={(next) => setOpen(next)}
        triggerLabel={
          <div className="flex text-primary items-center gap-2 px-2 py-2 rounded-xl border bg-white cursor-pointer">
            <span className="btn-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {selectedMoreFiltersCount}
            </span>

            <span className="text-sm font-semibold text-primary">
              More Filters
            </span>
            <ArrowDropdownIcon
              size={12}
              color="#27AE60"
              className={`transition-transform duration-200  ${
                open ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        }
        width="w-[700px]"
        align="right"
        renderContent={() => (
          <div className="flex h-[420px]">
            {/* Left panel */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {commercialMoreFilterSections?.map((section) => (
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
  {commercialMoreFilterSections.map((section) => {
    const mappedKey = commercialKeyMapping[section.key];
    const currentValue = commercial[mappedKey];

    return (
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

        {/* VERIFIED PROPERTIES (TOGGLE) */}
        {section.key === "Verified Properties" ? (
          <Toggle
            enabled={Boolean(currentValue)}
            onChange={(val) => {
              dispatch(
                setCommercialFilter({
                  key: mappedKey,
                  value: val,
                })
              );

              toast.success(
                val
                  ? "Verified properties enabled"
                  : "Verified properties disabled"
              );
            }}
          />
        ) : section.key === "Carpet Area" ? (
          /* CARPET AREA */
          <div className="space-y-4">
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
          /* OPTIONS */
          <div className="flex flex-wrap gap-3">
            {section.options?.map((opt) => {
              const isActive =
                section.selectionType === "multiple"
                  ? Array.isArray(currentValue) &&
                    currentValue.includes(opt)
                  : currentValue === opt;

              return (
                <SelectableButton
                  key={opt}
                  label={opt}
                  active={isActive}
                  selectionType={section.selectionType ?? "single"}
                  onClick={() => {
                    dispatch(
                      setCommercialFilter({
                        key: mappedKey,
                        value:
                          section.selectionType === "multiple"
                            ? toggleArrayValue(
                                (currentValue as string[]) || [],
                                opt
                              )
                            : opt,
                      })
                    );
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  })}
</div>

          </div>
        )}
      />
    </div>
  );
};

export default CommercialFilters;
