"use client";
import {
  selectCityWithLocalities,
  selectLocalitiesByCity,
} from "@/Redux/slice/citySlice";
import { setBudget, setLandFilter } from "@/Redux/slice/filterSlice";
import { RootState } from "@/Redux/store";
import FilterDropdown from "@/ui/FilterDropdown";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTrackBackground, Range } from "react-range";
import { PostedByOption } from "@/types/residential";
import { LandFilterKey } from "@/types";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";
import { landMoreFilterSections } from "../constants/constants";
import { getSelectedMoreFiltersCount } from "../count-helper/ResSelectedMoreFiltersCount";
import { landKeyMapping } from "@/types/land";
import { ArrowDropdownIcon } from "@/icons/icons";
import SelectableButton from "@/ui/SelectableButton";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";

/* -------------------- BUDGET CONSTANTS -------------------- */
const BUDGET_MIN = 5;
const BUDGET_MAX = 5000;
const BUDGET_STEP = 5;

const budgetOptions = [
  5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 2000, 3000,
  4000, 5000,
];

const formatBudget = (value: number) =>
  value >= 100
    ? `₹${value / 100}${value === 5000 ? "+" : ""} Cr`
    : `₹${value} Lac`;

const LandFilters = () => {
  const dispatch = useDispatch();

  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeFilter, setActiveFilter] = useState<LandFilterKey>("Land Type");

  const cityData = useSelector(selectCityWithLocalities);
  const localities = useSelector(selectLocalitiesByCity);
  const filtersState = useSelector((state: RootState) => state.filters);

  const { minPrice, maxPrice, land, listingTypeValue } = filtersState;
  const [budgetTouched, setBudgetTouched] = useState(false);

  const { locality, postedBy } = land;
  const dimensionLength = land.dimensions?.length;
  const dimensionWidth = land.dimensions?.width;
  const selectedLocalities = Array.isArray(locality) ? locality : [];
  const localityLabel =
    selectedLocalities.length === 0
      ? "Select Locality"
      : selectedLocalities.length === 1
        ? selectedLocalities[0]
        : `${selectedLocalities.length} Localities`;

  /* -------------------- BUDGET -------------------- */


  const [budgetRange, setBudgetRange] = useState<
    [number | null, number | null]
  >([minPrice ?? null, maxPrice ?? null]);

  const budgetLabel =
    budgetRange[0] == null && budgetRange[1] == null
      ? "Budget"
      : `${budgetRange[0] ? formatBudget(budgetRange[0]) : "Min"} - ${budgetRange[1] ? formatBudget(budgetRange[1]) : "Max"
      }`;

  const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];

  const [open, setOpen] = useState(false);

  const handleSectionClick = (key: LandFilterKey) => {
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


  /* -------------------- MORE FILTER CONFIG -------------------- */

  const selectedMoreFiltersCount = getSelectedMoreFiltersCount(
    land,
    landKeyMapping
  );
  const localityCount = selectedLocalities.length > 0 ? 1 : 0;
  const listingTypeCount = listingTypeValue ? 1 : 0;
  const moreFiltersBadgeCount =
    selectedMoreFiltersCount + localityCount + listingTypeCount;
  const displayedMoreFiltersBadgeCount = moreFiltersBadgeCount || 2;

  const CARPET_MIN = 300;
  const CARPET_MAX = 10000;

  const carpetOptions = [
    300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000,
  ];

  const [carpetRange, setCarpetRange] = useState<[number, number]>([
    land.plotArea?.min ?? CARPET_MIN,
    land.plotArea?.max ?? CARPET_MAX,
  ]);

  const booleanLandKeys = new Set([
    "cornerPlot",
    "readyToConstruct",
    "waterConnection",
    "electricityConnection",
    "priceNegotiable",
  ]);
  const selectedLandTypes = Array.isArray(land.landType)
    ? land.landType
    : [];

  const landTypeLabel =
    selectedLandTypes.length === 0
      ? "Asset Type"
      : selectedLandTypes.length === 1
        ? selectedLandTypes[0]
        : `${selectedLandTypes.length} Types`;
  const landTypeOptions =
    landMoreFilterSections.find(
      (section) => section.key === "Land Type"
    )?.options ?? [];

  const updatePlotArea = (next: [number, number]) => {
    setCarpetRange(next);
    dispatch(
      setLandFilter({
        key: "plotArea",
        value: {
          min: next[0] === CARPET_MIN ? undefined : next[0],
          max: next[1] === CARPET_MAX ? undefined : next[1],
        },
      })
    );
  };

  useEffect(() => {
    setCarpetRange([
      land.plotArea?.min ?? CARPET_MIN,
      land.plotArea?.max ?? CARPET_MAX,
    ]);
  }, [land.plotArea?.min, land.plotArea?.max]);



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
      {/* ---------- Localities ---------- */}
      <FilterDropdown
        className="shrink-0"
        triggerLabel={
          <span className="px-4 text-primary font-medium cursor-pointer whitespace-nowrap">
            {localityLabel}
          </span>
        }
        width="w-116"
        align="left"
        renderContent={(close) => (
          <div className="p-3">
            <h4 className="text-sm font-semibold mb-3">
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
              <>
                <div className="flex gap-2 flex-wrap">
                  {localities.map((loc: { name: string }) => {
                    const isSelected = selectedLocalities.includes(loc.name);

                    return (
                      <button
                        key={loc.name}
                        onClick={() => {
                          dispatch(
                            setLandFilter({
                              key: "locality",
                              value: toggleArrayValue(
                                selectedLocalities,
                                loc.name
                              ),
                            })
                          );
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition ${isSelected
                            ? "bg-green-100 text-green-700 border-green-400"
                            : "bg-white hover:bg-gray-50 border-gray-300"
                          }`}
                      >
                        {isSelected ? (
                          <FiCheck className="text-green-600 text-base" />
                        ) : (
                          <FiPlus className="text-gray-500 text-base" />
                        )}
                        <span>{loc.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => {
                      dispatch(
                        setLandFilter({
                          key: "locality",
                          value: [],
                        })
                      );
                    }}
                    disabled={selectedLocalities.length === 0}
                    className={`flex items-center gap-1 text-sm font-medium ${
                      selectedLocalities.length > 0
                        ? "text-red-500 hover:underline"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <FiX />
                    Clear All
                  </button>

                  <button
                    onClick={close}
                    className="text-green-600 font-semibold text-sm hover:underline"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      />

      {/* ---------- Budget ---------- */}

      <FilterDropdown
        className="shrink-0"
        triggerLabel={
          <span className="px-4 text-primary font-medium cursor-pointer whitespace-nowrap">
            {budgetLabel}
          </span>
        }
        width="w-[320px]"
        align="left"
        renderContent={() => (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Budget</h4>

            {/* ---------- Min / Max Dropdowns ---------- */}
            <div className="flex gap-3">
              {/* Min */}
              <select
                value={budgetRange[0] ?? ""}
                onChange={(e) => {
                  setBudgetTouched(true);
                  setBudgetRange([
                    e.target.value ? Number(e.target.value) : null,
                    budgetRange[1],
                  ]);
                }}
                className="w-1/2 border border-gray-400 rounded-md px-3 py-2 text-sm 
                 focus:outline-none focus:ring-0 focus:border-gray-400
                 hover:border-gray-400 active:border-gray-400"
              >
                <option value="">Min</option>
                {budgetOptions.map((v) => (
                  <option key={v} value={v}>
                    ₹ {formatBudget(v)}
                  </option>
                ))}
              </select>

              <span className="flex items-center justify-center text-md text-gray-500 min-w-5">
                to
              </span>

              {/* Max */}
              <select
                value={budgetRange[1] ?? ""}
                onChange={(e) => {
                  setBudgetTouched(true);
                  setBudgetRange([
                    budgetRange[0],
                    e.target.value ? Number(e.target.value) : null,
                  ]);
                }}
                className="w-1/2 border border-gray-400 rounded-md px-3 py-2 text-sm 
                 focus:outline-none focus:ring-0 focus:border-gray-400
                 hover:border-gray-400 active:border-gray-400"
              >
                <option value="">Max</option>
                {budgetOptions.map((v) => (
                  <option key={v} value={v}>
                    ₹ {formatBudget(v)}
                  </option>
                ))}
              </select>
            </div>

            {/* ---------- Range Slider ---------- */}
            <Range
              step={BUDGET_STEP}
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              values={[
                budgetRange[0] ?? BUDGET_MIN,
                budgetRange[1] ?? BUDGET_MAX,
              ]}
              onChange={(values) => {
                const [min, max] = values as [number, number];
                setBudgetTouched(true);

                setBudgetRange([
                  min === BUDGET_MIN ? null : min,
                  max === BUDGET_MAX ? null : max,
                ]);
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
                        colors: ["#E5E7EB", "#16A34A", "#E5E7EB"], // gray → green → gray
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

            {/* ---------- Label ---------- */}
            <div className="text-xs text-gray-500 text-center">
              {budgetRange[0] ? formatBudget(budgetRange[0]) : "Min"} –{" "}
              {budgetRange[1] ? formatBudget(budgetRange[1]) : "Max"}
            </div>
          </div>
        )}
      />

      {/* ---------- Plot Area ---------- */}


      {/* ---------- Posted By ---------- */}
      <FilterDropdown
        className="shrink-0"
        triggerLabel={
          <span className="px-4 font-medium text-primary cursor-pointer whitespace-nowrap">
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
                    setLandFilter({
                      key: "postedBy",
                      value: [opt],
                    })
                  );
                  close?.();
                }}
                className={`px-2 py-1 rounded block w-full text-left hover:bg-gray-100 ${postedBy?.includes(opt) ? "font-semibold bg-gray-100" : ""
                  }`}
              >
                {opt}
              </button>
            ))}
            <button
              onClick={() => {
                dispatch(
                  setLandFilter({
                    key: "postedBy",
                    value: [],
                  })
                );
                close?.();
              }}
              disabled={!postedBy || postedBy.length === 0}
              className={`mt-2 px-2 py-1 rounded block w-full text-left ${
                postedBy && postedBy.length > 0
                  ? "text-red-500 hover:bg-red-50"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              Clear
            </button>
          </div>
        )}
      />


      {/* ---------- Property Type ---------- */}
      <FilterDropdown
        className="shrink-0"
        triggerLabel={
          <div className="flex w-30 items-center justify-between px-4 font-medium text-primary cursor-pointer whitespace-nowrap">
            <span className="truncate whitespace-nowrap">{landTypeLabel}</span>

            {selectedLandTypes.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                {selectedLandTypes.length}
              </span>
            )}
          </div>
        }
        width="w-72"
        align="left"
        renderContent={(close) => (
          <div className="space-y-3 p-3">
            <h4 className="text-sm font-semibold">Land Type</h4>

            <div className="flex flex-wrap gap-2">
              {landTypeOptions.map((option) => {
                const isActive =
                  selectedLandTypes.includes(option);

                return (
                  <button
                    key={option}
                    onClick={() => {
                      dispatch(
                        setLandFilter({
                          key: "landType",
                          value: toggleArrayValue(
                            selectedLandTypes,
                            option
                          ),
                        })
                      );
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${isActive
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
                    setLandFilter({
                      key: "landType",
                      value: [],
                    })
                  )
                }
                disabled={selectedLandTypes.length === 0}
                className={`text-sm font-medium ${selectedLandTypes.length > 0
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


      {/* ---------- MORE FILTER MODAL ---------- */}
      <FilterDropdown
        className="shrink-0"
        open={open}
        onOpenChange={(next) => setOpen(next)}
        triggerLabel={
          <div className="flex text-primary items-center gap-2 px-2 py-2 rounded-xl border bg-white cursor-pointer whitespace-nowrap">
            <span className="btn-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {displayedMoreFiltersBadgeCount}
            </span>

            <span className="text-sm font-semibold text-primary whitespace-nowrap">
              More Filters
            </span>

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
            {/* ================= LEFT PANEL ================= */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {landMoreFilterSections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => handleSectionClick(section.key)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200 cursor-pointer ${activeFilter === section.key
                    ? "font-semibold text-primary"
                    : "hover:bg-gray-50"
                    }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {/* ================= RIGHT PANEL ================= */}
            <div
              ref={rightPanelRef}
              className="flex-1 p-6 overflow-y-auto space-y-10"
            >
              {landMoreFilterSections.map((section) => {
                const mappedKey = landKeyMapping[section.key];
                const currentValue = land[mappedKey];
                const isPostedByFilter = mappedKey === "postedBy";

                return (
                  <div
                    key={section.key}
                    ref={(el) => {
                      sectionRefs.current[section.key] = el;
                    }}
                    className="space-y-4"
                  >
                    {/* SECTION TITLE */}
                    <h3 className="text-sm font-semibold text-gray-900">
                      {section.label}
                    </h3>

                    {/* ========== VERIFIED PROPERTIES ========== */}
                    {section.key === "Verified Properties" ? (
                      <Toggle
                        enabled={!!land.verifiedProperties}
                        onChange={(val) => {
                          dispatch(
                            setLandFilter({
                              key: "verifiedProperties",
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
                    ) : section.key === "Plot Area" ? (
                      /* ========== PLOT AREA ========== */
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <select
                            value={carpetRange[0]}
                            onChange={(e) =>
                              updatePlotArea([
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
                              updatePlotArea([
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
                            updatePlotArea(values as [number, number])
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
                    ) : section.key === "Dimensions" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Length (ft)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={dimensionLength ?? ""}
                            onChange={(e) => {
                              const nextLength = e.target.value
                                ? Number(e.target.value)
                                : undefined;
                              dispatch(
                                setLandFilter({
                                  key: "dimensions",
                                  value: {
                                    length: nextLength,
                                    width: dimensionWidth,
                                  },
                                })
                              );
                            }}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="e.g. 40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Width (ft)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={dimensionWidth ?? ""}
                            onChange={(e) => {
                              const nextWidth = e.target.value
                                ? Number(e.target.value)
                                : undefined;
                              dispatch(
                                setLandFilter({
                                  key: "dimensions",
                                  value: {
                                    length: dimensionLength,
                                    width: nextWidth,
                                  },
                                })
                              );
                            }}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            placeholder="e.g. 60"
                          />
                        </div>
                      </div>
                    ) : (
                      /* ========== OPTIONS (SINGLE / MULTIPLE) ========== */
                      <div className="flex flex-wrap gap-3">
                        {section.options?.map((opt) => {
                          const isBooleanFilter = booleanLandKeys.has(mappedKey);
                          const isActive =
                            isBooleanFilter
                              ? Boolean(currentValue)
                              : isPostedByFilter
                                ? Array.isArray(currentValue) &&
                                  currentValue.includes(opt)
                              : section.selectionType === "multiple"
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
                                  setLandFilter({
                                    key: mappedKey,
                                    value:
                                      isBooleanFilter
                                        ? !Boolean(currentValue)
                                        : isPostedByFilter
                                          ? [opt]
                                        : section.selectionType === "multiple"
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

export default LandFilters;
