"use client";
import React, { useEffect, useRef, useState } from "react";
import { getTrackBackground, Range } from "react-range";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/Redux/store";
import { setBudget, setResidentialFilter } from "@/Redux/slice/filterSlice";
import FilterDropdown from "@/ui/FilterDropdown";
import {
  BHKOption,
  PostedByOption,
  residentialKeyMapping,
} from "@/types/residential";
import { buildSearchParams } from "./buildSearchParams";
import { searchFilter } from "@/data/ClientData";
import {
  selectCityWithLocalities,
  selectLocalitiesByCity,
} from "@/Redux/slice/citySlice";
import { RESFilterKey } from "@/types";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  budgetOptions,
  CARPET_MAX,
  CARPET_MIN,
  carpetOptions,
  formatBudget,
  moreFilterSections,
} from "../constants/constants";
import { ArrowDropdownIcon } from "@/icons/icons";
import SelectableButton from "@/ui/SelectableButton";
import { getSelectedMoreFiltersCount } from "../count-helper/ResSelectedMoreFiltersCount";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";
import { formatLabel } from "@/utilies/formatLabel";

const ResidentialFilters = () => {
  const dispatch = useDispatch();

  const rightPanelRef = useRef<HTMLDivElement | null>(null);

  const cityData = useSelector(selectCityWithLocalities);
  const localities = useSelector(selectLocalitiesByCity);
  const filtersState = useSelector((state: RootState) => state.filters);
  const { minPrice, maxPrice, residential, listingTypeValue } = filtersState;
  const [budgetTouched, setBudgetTouched] = useState(false);

  const { locality, bhk, listingSource } = residential;
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] =
    useState<RESFilterKey>("Property Type");

  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const POSTED_BY_MAP: Record<PostedByOption, string> = {
    Owners: "user",
    Agents: "agent",
    Builders: "builder",
  };


  const keyMapping: Record<RESFilterKey, keyof typeof residential> = {
    "Property Type": "propertyType",
    "Sales Type": "transactionType",
    "Covered Area": "coveredArea",
    "Possession Status": "constructionStatus",
    Bathroom: "bathroom",
    Balcony: "balcony",
    Parking: "parking",
    Furnishing: "furnishing",
    Amenities: "amenities",
    Facing: "facing",
    "Posted Since": "postedSince",
    "Posted By": "listingSource",
  };

  const [carpetRange, setCarpetRange] = useState<[number, number]>([
    CARPET_MIN,
    CARPET_MAX,
  ]);

  const localityLabel =
    !locality || locality.length === 0
      ? "Select Locality"
      : locality.length === 1
        ? locality[0]
        : `${locality.length} Localities`;

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

  const getBhkNumber = (b: BHKOption) =>
    b === "6+ BHK" ? 6 : Number(b.split(" ")[0]);

  const bhkLabel = bhk ? `${bhk}${bhk === 6 ? "+" : ""} BHK` : "BHK";

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

  useEffect(() => {
    searchFilter(buildSearchParams(filtersState));
  }, [filtersState]);

  const handleSectionClick = (key: RESFilterKey) => {
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
    residential,
    residentialKeyMapping,
  );
  const localityCount = Array.isArray(locality) && locality.length > 0 ? 1 : 0;
  const listingTypeCount = listingTypeValue ? 1 : 0;
  const moreFiltersBadgeCount =
    selectedMoreFiltersCount + localityCount + listingTypeCount;
  /* -------------------- MORE FILTER CONFIG -------------------- */

  useEffect(() => {
    if (!budgetTouched) return;

    dispatch(
      setBudget({
        min: budgetRange[0] ?? null,
        max: budgetRange[1] ?? null,
      }),
    );
  }, [budgetRange, budgetTouched, dispatch]);

  return (
    <>
      {/* ==================== FILTER BAR ==================== */}
      <div className="flex gap-1 items-center">
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
                  {/* Locality Pills */}
                  <div className="flex gap-2 flex-wrap">
                    {localities.map((loc: { name: string }) => {
                      const isSelected =
                        Array.isArray(locality) && locality.includes(loc.name);

                      return (
                        <button
                          key={loc.name}
                          onClick={() => {
                            dispatch(
                              setResidentialFilter({
                                key: "locality",
                                value: toggleArrayValue(
                                  locality || [],
                                  loc.name,
                                ),
                              }),
                            );
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition ${
                            isSelected
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

                  {/* Footer Actions */}
                  <div className="flex justify-between items-center mt-4">
                    {/* Clear All */}
                    <button
                      onClick={() => {
                        dispatch(
                          setResidentialFilter({
                            key: "locality",
                            value: [],
                          }),
                        );
                      }}
                      disabled={!locality || locality.length === 0}
                      className={`flex items-center gap-1 text-sm font-medium ${
                        locality && locality.length > 0
                          ? "text-red-500 hover:underline"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <FiX />
                      Clear All
                    </button>

                    {/* Done */}
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

        {/* ---------- BHK ---------- */}
        <FilterDropdown
          key={bhk}
          triggerLabel={
            <span className="px-4 text-primary font-medium cursor-pointer">
              {bhkLabel}
            </span>
          }
          width="w-86"
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
                        dispatch(
                          setResidentialFilter({
                            key: "bhk",
                            value,
                          }),
                        );
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
                    const mappedValue = POSTED_BY_MAP[opt];
                    dispatch(
                      setResidentialFilter({
                        key: "listingSource",
                        value: listingSource === mappedValue ? "" : mappedValue,
                      }),
                    );
                    close?.();
                  }}
                  className={`px-2 py-1 rounded block w-full text-left hover:bg-gray-100 ${
                    listingSource === POSTED_BY_MAP[opt]
                      ? "font-semibold bg-gray-100"
                      : ""
                  }`}
                >
                  {opt}
                </button>
              ))}
              <button
                onClick={() => {
                  dispatch(
                    setResidentialFilter({
                      key: "listingSource",
                      value: "",
                    }),
                  );
                  close?.();
                }}
                disabled={!listingSource}
                className={`mt-2 px-2 py-1 rounded block w-full text-left ${
                  listingSource
                    ? "text-red-500 hover:bg-red-50"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                Clear
              </button>
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
                {moreFiltersBadgeCount}
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
              <div
                ref={rightPanelRef}
                className="flex-1 p-6 overflow-y-auto space-y-10"
              >
                {moreFilterSections.map((section) => (
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
                    {section.key === "Covered Area" ? (
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
                                className="h-4 w-4 bg-green-600 rounded-full shadow"
                              />
                            );
                          }}
                        />

                        <div className="text-xs text-gray-500">
                          {carpetRange[0]} – {carpetRange[1]} sqft
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {section.options?.map((opt) => {
                          const mappedKey = keyMapping[section.key];
                          const currentValue = residential[mappedKey];

                          const isActive =
                            section.selectionType === "multiple"
                              ? Array.isArray(currentValue) &&
                                currentValue.includes(opt)
                              : currentValue === opt;

                          return (
                            <SelectableButton
                              key={opt}
                              label={formatLabel(opt)} // 👈 UI only
                              active={isActive}
                              selectionType={section.selectionType ?? "single"}
                              onClick={() => {
                                dispatch(
                                  setResidentialFilter({
                                    key: mappedKey,
                                    value:
                                      section.selectionType === "multiple"
                                        ? toggleArrayValue(
                                            (currentValue as string[]) || [],
                                            opt,
                                          )
                                        : opt,
                                  }),
                                );
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        />
      </div>
    </>
  );
};

export default ResidentialFilters;
