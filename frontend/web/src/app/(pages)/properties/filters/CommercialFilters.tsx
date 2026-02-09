"use client";
import FilterDropdown from "@/ui/FilterDropdown";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/Redux/store";
import {
  selectCityWithLocalities,
  selectLocalitiesByCity,
} from "@/Redux/slice/citySlice";
import { setBudget, setCommercialFilter } from "@/Redux/slice/filterSlice";
import React, { useEffect, useRef, useState } from "react";
import {
  commercialMoreFilterSections,
  formatBudget,
} from "../constants/constants";
import { getTrackBackground, Range } from "react-range";
import { PostedByOption } from "@/types/residential";
import { CommercialFilterKey } from "@/types";
import { ArrowDropdownIcon } from "@/icons/icons";
import { getSelectedMoreFiltersCount } from "../count-helper/ResSelectedMoreFiltersCount";
import { commercialKeyMapping } from "@/types/commercial";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";
import SelectableButton from "@/ui/SelectableButton";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";

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
  const [budgetTouched, setBudgetTouched] = useState(false);

  const cityData = useSelector(selectCityWithLocalities);
  const localities = useSelector(selectLocalitiesByCity);
  const filtersState = useSelector((state: RootState) => state.filters);

  const { minPrice, maxPrice, commercial } = filtersState;

  const { locality, listingSource } = commercial;
  const localityList = Array.isArray(locality)
    ? locality
    : locality
      ? [locality]
      : [];

  const [budgetRange, setBudgetRange] = useState<
    [number | null, number | null]
  >([minPrice ?? null, maxPrice ?? null]);

  const budgetLabel =
    budgetRange[0] == null && budgetRange[1] == null
      ? "Budget"
      : `${budgetRange[0] ? formatBudget(budgetRange[0]) : "Min"} - ${budgetRange[1] ? formatBudget(budgetRange[1]) : "Max"
      }`;

  const [carpetRange, setCarpetRange] = useState<[number, number]>([
    commercial.carpetArea?.min ?? CARPET_MIN,
    commercial.carpetArea?.max ?? CARPET_MAX,
  ]);

  const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];
  const localityLabel =
    localityList.length === 0
      ? "Select Locality"
      : localityList.length === 1
        ? localityList[0]
        : `${localityList.length} Localities`;


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



  useEffect(() => {
    if (!budgetTouched) return;

    dispatch(
      setBudget({
        min: budgetRange[0] ?? null,
        max: budgetRange[1] ?? null,
      })
    );
  }, [budgetRange, budgetTouched, dispatch]);

  useEffect(() => {
    // Only dispatch if values changed from default to prevent infinite loops
    if (carpetRange[0] !== CARPET_MIN || carpetRange[1] !== CARPET_MAX) {
      dispatch(
        setCommercialFilter({
          key: "carpetArea",
          value: {
            min: carpetRange[0],
            max: carpetRange[1],
          },
        })
      );
    }
  }, [carpetRange, dispatch]);

  return (
    <div className="flex gap-4 items-center">
      {/* ---------- Localities ---------- */}
       <FilterDropdown
        triggerLabel={
          <div className="flex justify-center items-center">
            <span className="px-4 text-primary font-medium cursor-pointer">
              {localityLabel}
            </span>
          </div>
        }
        width="w-86"
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
                  {localities.map((loc) => {
                    const isSelected =
                      localityList.includes(loc.name);

                    return (
                      <button
                        key={loc.name}
                        onClick={() => {
                          dispatch(
                            setCommercialFilter({
                              key: "locality",
                              value: toggleArrayValue(localityList, loc.name),
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
                        setCommercialFilter({
                          key: "locality",
                          value: [],
                        })
                      );
                    }}
                    disabled={localityList.length === 0}
                    className={`flex items-center gap-1 text-sm font-medium ${localityList.length > 0
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

              <span className="flex items-center justify-center text-md text-gray-500 min-w-8">
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
                      key: "listingSource", // Use the backend key directly or via mapping
                      value: opt,
                    })
                  );
                  close?.();
                }}
                className={`px-2 py-1 rounded block w-full text-left hover:bg-gray-100 ${Array.isArray(listingSource)
                  ? listingSource.includes(opt)
                    ? "font-semibold bg-gray-100"
                    : ""
                  : listingSource === opt
                    ? "font-semibold bg-gray-100"
                    : ""
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
              className={`transition-transform duration-200  ${open ? "rotate-180" : "rotate-0"
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
                  className={`w-full text-left px-4 py-3 border-b border-gray-200   ${activeFilter === section.key
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

export default CommercialFilters;
