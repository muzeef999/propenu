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
import {
  LandFilterKey,
  MoreFilterSection,
  MoreFilterSectionLand,
} from "@/types";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";
import { landMoreFilterSections } from "../constants/constants";
import { getSelectedMoreFiltersCount } from "../count-helper/ResSelectedMoreFiltersCount";
import { landKeyMapping } from "@/types/land";
import { ArrowDropdownIcon } from "@/icons/icons";
import SelectableButton from "@/ui/SelectableButton";

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

  const { minPrice, maxPrice, land } = filtersState;
  const [budgetTouched, setBudgetTouched] = useState(false);

  const { locality, postedBy } = land;

  /* -------------------- BUDGET -------------------- */


const [budgetRange, setBudgetRange] = useState<
    [number | null, number | null]
  >([minPrice ?? null, maxPrice ?? null]);

  const budgetLabel =
    budgetRange[0] == null && budgetRange[1] == null
      ? "Budget"
      : `${budgetRange[0] ? formatBudget(budgetRange[0]) : "Min"} - ${
          budgetRange[1] ? formatBudget(budgetRange[1]) : "Max"
        }`;

  const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];

  const [open, setOpen] = useState(false);

  const [verifiedOnly, setVerifiedOnly] = useState(false);

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

  const CARPET_MIN = 300;
  const CARPET_MAX = 10000;

  const carpetOptions = [
    300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000,
  ];

  const [carpetRange, setCarpetRange] = useState<[number, number]>([
    CARPET_MIN,
    CARPET_MAX,
  ]);


  
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
    <div className="flex gap-4  items-center">
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
                        setLandFilter({
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
                    setLandFilter({
                      key: "postedBy",
                      value: opt,
                    })
                  );
                  close?.();
                }}
                className={`px-2 py-1 rounded block w-full text-left hover:bg-gray-100 ${
                  postedBy?.includes(opt) ? "font-semibold bg-gray-100" : ""
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
        className={`transition-transform duration-200 ${
          open ? "rotate-180" : "rotate-0"
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
            className={`w-full text-left px-4 py-3 border-b border-gray-200 ${
              activeFilter === section.key
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
                    setVerifiedOnly(val);
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
                /* ========== OPTIONS (SINGLE / MULTIPLE) ========== */
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
                            setLandFilter({
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

export default LandFilters;
