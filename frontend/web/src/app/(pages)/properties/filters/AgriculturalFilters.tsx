"use client";

import {
  selectCityWithLocalities,
  selectLocalitiesByCity,
} from "@/Redux/slice/citySlice";
import { setAgriculturalFilter, setBudget } from "@/Redux/slice/filterSlice";
import { RootState } from "@/Redux/store";
import { ArrowDropdownIcon } from "@/icons/icons";
import { agriculturalKeyMapping } from "@/types/agricultural";
import { AgriculturalFilterKey } from "@/types";
import FilterDropdown from "@/ui/FilterDropdown";
import SelectableButton from "@/ui/SelectableButton";
import Toggle from "@/ui/ToggleSwitch";
import { PostedByOption } from "@/types/residential";
import { useEffect, useRef, useState } from "react";
import { getTrackBackground, Range } from "react-range";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
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
import { getSelectedMoreFiltersCount } from "../count-helper/ResSelectedMoreFiltersCount";

const MULTI_SELECT_KEYS = new Set([
  "agriculturalType",
  "agriculturalSubType",
  "soilType",
  "irrigationType",
  "waterSource",
  "borewellCount",
  "currentCrop",
  "plantationAge",
  "roadWidth",
  "accessRoadType",
  "postedBy",
]);

const BOOLEAN_KEYS = new Set([
  "electricityConnection",
  "boundaryWall",
  "priceNegotiable",
]);

const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];

const normalizeBudgetRange = (
  min: number | null,
  max: number | null
): [number | null, number | null] => {
  if (min == null || max == null) return [min, max];
  return min <= max ? [min, max] : [max, min];
};

const AgriculturalFilters = () => {
  const dispatch = useDispatch();

  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});


  const cityData = useSelector(selectCityWithLocalities);
  const localities = useSelector(selectLocalitiesByCity);
  const filtersState = useSelector((state: RootState) => state.filters);
  const { minPrice, maxPrice, agricultural, listingTypeValue } = filtersState;

  const [budgetTouched, setBudgetTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] =
    useState<AgriculturalFilterKey>("Agricultural Type");
  const [budgetRange, setBudgetRange] = useState<
    [number | null, number | null]
  >(() => normalizeBudgetRange(minPrice ?? null, maxPrice ?? null));
  const [carpetRange, setCarpetRange] = useState<[number, number]>([
    agricultural.totalArea?.min ?? CARPET_MIN,
    agricultural.totalArea?.max ?? CARPET_MAX,
  ]);

  const { locality, postedBy } = agricultural;

  const budgetLabel =
    budgetRange[0] == null && budgetRange[1] == null
      ? "Budget"
      : `${budgetRange[0] ? formatBudget(budgetRange[0]) : "Min"} - ${budgetRange[1] ? formatBudget(budgetRange[1]) : "Max"
      }`;

  const selectedMoreFiltersCount = getSelectedMoreFiltersCount(
    agricultural,
    agriculturalKeyMapping
  );
  const localityCount = locality ? 1 : 0;
  const listingTypeCount = listingTypeValue ? 1 : 0;
  const moreFiltersBadgeCount =
    selectedMoreFiltersCount + localityCount + listingTypeCount;
  const displayedMoreFiltersBadgeCount = moreFiltersBadgeCount || 2;

  const handleSectionClick = (key: AgriculturalFilterKey) => {
    const container = rightPanelRef.current;
    const target = sectionRefs.current[key];

    if (!container || !target) return;

    const top = target.offsetTop - container.offsetTop - 12;
    container.scrollTo({ top, behavior: "smooth" });
    setActiveFilter(key);
  };
  const agriculturalTypeOptions =
  agriculturalMoreFilterSections.find(
    (section) => section.key === "Agricultural Type"
  )?.options ?? [];
  const selectedAgriculturalTypes =
  agricultural.agriculturalType ?? [];
  const propertyTypeLabel =
  selectedAgriculturalTypes.length === 0
    ? "Asset Type"
    : selectedAgriculturalTypes.length === 1
      ? selectedAgriculturalTypes[0]
      : `${selectedAgriculturalTypes.length} Types`;

  const toggleArrayValue = (arr: string[] = [], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const updateTotalArea = (next: [number, number]) => {
    setCarpetRange(next);
    dispatch(
      setAgriculturalFilter({
        key: "totalArea",
        value: {
          min: next[0] === CARPET_MIN ? undefined : next[0],
          max: next[1] === CARPET_MAX ? undefined : next[1],
        },
      })
    );
  };

  useEffect(() => {
    setCarpetRange([
      agricultural.totalArea?.min ?? CARPET_MIN,
      agricultural.totalArea?.max ?? CARPET_MAX,
    ]);
  }, [agricultural.totalArea?.min, agricultural.totalArea?.max]);

  useEffect(() => {
    if (!budgetTouched) return;

    dispatch(
      setBudget({
        min: budgetRange[0] ?? null,
        max: budgetRange[1] ?? null,
      })
    );
  }, [budgetRange, budgetTouched, dispatch]);

  return (
    <div className="flex gap-1 items-center">
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
              {cityData ? `Localities in ${cityData.city}` : "Select city first"}
            </h4>

            {!cityData && (
              <p className="text-sm text-gray-400">
                Please select a city to see localities
              </p>
            )}

            {cityData && (
              <div className="flex gap-2 flex-wrap">
                {localities.map((loc: { name: string }) => (
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
                    className={`px-2 py-1 rounded text-sm hover:bg-gray-100 ${locality === loc.name ? "font-semibold bg-gray-100" : ""
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

            <div className="flex gap-3">
              <select
                value={budgetRange[0] ?? ""}
                onChange={(e) => {
                  setBudgetTouched(true);
                  setBudgetRange(
                    normalizeBudgetRange(
                      e.target.value ? Number(e.target.value) : null,
                      budgetRange[1]
                    )
                  );
                }}
                className="w-1/2 border border-gray-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-gray-400 hover:border-gray-400 active:border-gray-400"
              >
                <option value="">Min</option>
                {budgetOptions.map((v) => (
                  <option key={v} value={v}>
                    {formatBudget(v)}
                  </option>
                ))}
              </select>

              <span className="flex items-center justify-center text-md text-gray-500 min-w-5">
                to
              </span>

              <select
                value={budgetRange[1] ?? ""}
                onChange={(e) => {
                  setBudgetTouched(true);
                  setBudgetRange(
                    normalizeBudgetRange(
                      budgetRange[0],
                      e.target.value ? Number(e.target.value) : null
                    )
                  );
                }}
                className="w-1/2 border border-gray-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-gray-400 hover:border-gray-400 active:border-gray-400"
              >
                <option value="">Max</option>
                {budgetOptions.map((v) => (
                  <option key={v} value={v}>
                    {formatBudget(v)}
                  </option>
                ))}
              </select>
            </div>

            <Range
              step={BUDGET_STEP}
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              values={[budgetRange[0] ?? BUDGET_MIN, budgetRange[1] ?? BUDGET_MAX]}
              onChange={(values) => {
                const [min, max] = values as [number, number];
                setBudgetTouched(true);
                setBudgetRange(
                  normalizeBudgetRange(
                    min === BUDGET_MIN ? null : min,
                    max === BUDGET_MAX ? null : max
                  )
                );
              }}
              renderTrack={({ props, children }) => {
                const { key, ...restProps } = props as any;
                return (
                  <div
                    key={key}
                    {...restProps}
                    className="h-1 w-full rounded"
                    style={{
                      background: getTrackBackground({
                        values: [
                          budgetRange[0] ?? BUDGET_MIN,
                          budgetRange[1] ?? BUDGET_MAX,
                        ],
                        colors: ["#E5E7EB", "#16A34A", "#E5E7EB"],
                        min: BUDGET_MIN,
                        max: BUDGET_MAX,
                      }),
                    }}
                  >
                    {children}
                  </div>
                );
              }}
              renderThumb={({ props }) => {
                const { key, ...restProps } = props;
                return (
                  <div
                    key={key}
                    {...restProps}
                    className="h-4 w-4 bg-green-600 rounded-full shadow"
                  />
                );
              }}
            />

            <div className="text-xs text-gray-500 text-center">
              {budgetRange[0] ? formatBudget(budgetRange[0]) : "Min"} -{" "}
              {budgetRange[1] ? formatBudget(budgetRange[1]) : "Max"}
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
        renderContent={() => (
          <div>
            <h4 className="text-sm font-semibold mb-2">Posted By</h4>
            {postedByOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  dispatch(
                    setAgriculturalFilter({
                      key: "postedBy",
                      value: toggleArrayValue(postedBy || [], opt),
                    })
                  );
                }}
                className={`px-2 py-1 rounded block w-full text-left hover:bg-gray-100 ${postedBy?.includes(opt) ? "font-semibold bg-gray-100" : ""
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      />
      {/* ---------- Property Type ---------- */}
<FilterDropdown
  triggerLabel={
    <div className="flex w-40 items-center justify-between px-4 font-medium text-primary cursor-pointer">
      <span className="truncate">{propertyTypeLabel}</span>
      {selectedAgriculturalTypes.length > 0 && (
        <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
          {selectedAgriculturalTypes.length}
        </span>
      )}
    </div>
  }
  width="w-72"
  align="left"
  renderContent={(close) => (
    <div className="space-y-3 p-3">
      <h4 className="text-sm font-semibold">Agricultural Type</h4>

      <div className="flex flex-wrap gap-2">
        {agriculturalTypeOptions.map((option) => {
          const isActive =
            selectedAgriculturalTypes.includes(option);

          return (
            <button
              key={option}
              onClick={() => {
                dispatch(
                  setAgriculturalFilter({
                    key: "agriculturalType",
                    value: toggleArrayValue(
                      selectedAgriculturalTypes,
                      option
                    ),
                  })
                );
              }}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                isActive
                  ? "border-green-400 bg-green-100 text-green-700"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() =>
            dispatch(
              setAgriculturalFilter({
                key: "agriculturalType",
                value: [],
              })
            )
          }
          disabled={selectedAgriculturalTypes.length === 0}
          className={`text-sm font-medium ${
            selectedAgriculturalTypes.length > 0
              ? "text-red-500 hover:underline"
              : "cursor-not-allowed text-gray-400"
          }`}
        >
          Clear All
        </button>

        <button
          onClick={close}
          className="text-sm font-semibold text-green-600 hover:underline"
        >
          Done
        </button>
      </div>
    </div>
  )}
/>


      <FilterDropdown
        open={open}
        onOpenChange={(next) => setOpen(next)}
        triggerLabel={
          <div className="flex text-primary items-center gap-2 px-2 py-2 rounded-full bg-white cursor-pointer">
            <span className="btn-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {displayedMoreFiltersBadgeCount}
            </span>
            <span className="text-sm font-semibold text-primary">More Filters</span>
            <ArrowDropdownIcon
              size={12}
              color="#27AE60"
              className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"
                }`}
            />
          </div>
        }
        width="w-[700px]"
        align="right"
        renderContent={() => (
          <div className="flex h-[420px]">
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {agriculturalMoreFilterSections?.map((section) => (
                <button
                  key={section.key}
                  onClick={() => {
                    handleSectionClick(section.key);
                    setActiveFilter(section.key);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200 ${activeFilter === section.key
                      ? "font-semibold text-primary"
                      : "hover:bg-gray-50"
                    }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <div
              ref={rightPanelRef}
              className="flex-1 p-6 overflow-y-auto space-y-10"
            >
              {agriculturalMoreFilterSections.map((section) => {
                const mappedKey = agriculturalKeyMapping[section.key];
                const currentValue = agricultural[mappedKey];
                const isBooleanFilter = BOOLEAN_KEYS.has(mappedKey);
                const isMultiSelect =
                  section.selectionType === "multiple" ||
                  MULTI_SELECT_KEYS.has(mappedKey);

                return (
                  <div
                    key={section.key}
                    ref={(el) => {
                      sectionRefs.current[section.key] = el;
                    }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-semibold text-gray-900">
                      {section.label}
                    </h3>

                    {section.key === "Verified Properties" ? (
                      <Toggle
                        enabled={Boolean(currentValue)}
                        onChange={(val) => {
                          dispatch(
                            setAgriculturalFilter({
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
                    ) : section.key === "Total Area" ? (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <select
                            value={carpetRange[0]}
                            onChange={(e) =>
                              updateTotalArea([Number(e.target.value), carpetRange[1]])
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
                              updateTotalArea([carpetRange[0], Number(e.target.value)])
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
                            updateTotalArea(values as [number, number])
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
                          {carpetRange[0]} - {carpetRange[1]} sqft
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {section.options?.map((opt) => {
                          const isStateRestrictions = mappedKey === "stateRestrictions";
                          const stateRestrictionValue = opt === "Applicable";

                          const isActive = isStateRestrictions
                            ? currentValue === stateRestrictionValue
                            : isBooleanFilter
                              ? Boolean(currentValue)
                              : isMultiSelect
                                ? Array.isArray(currentValue) &&
                                currentValue.includes(opt)
                                : currentValue === opt;

                          return (
                            <SelectableButton
                              key={opt}
                              label={opt}
                              active={isActive}
                              selectionType={isMultiSelect ? "multiple" : "single"}
                              onClick={() => {
                                dispatch(
                                  setAgriculturalFilter({
                                    key: mappedKey,
                                    value: isStateRestrictions
                                      ? stateRestrictionValue
                                      : isBooleanFilter
                                        ? !Boolean(currentValue)
                                        : isMultiSelect
                                          ? toggleArrayValue(
                                            Array.isArray(currentValue)
                                              ? currentValue
                                              : [],
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

export default AgriculturalFilters;
