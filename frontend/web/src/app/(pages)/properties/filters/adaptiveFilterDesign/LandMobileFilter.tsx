"use client";

import React, { useEffect, useMemo, useState } from "react";
import { IoIosSearch } from "react-icons/io";
import {
  IoChevronBackOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from "react-icons/io5";
import { getTrackBackground, Range } from "react-range";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/Redux/store";
import { selectCityWithLocalities } from "@/Redux/slice/citySlice";
import {
  categoryOption,
  resetLandFilters,
  setBudget,
  setCategory,
  setLandFilter,
  setListingType,
  setSearchText,
} from "@/Redux/slice/filterSlice";
import { LandFilterKey } from "@/types";
import { PostedByOption } from "@/types/residential";
import { landKeyMapping } from "@/types/land";
import { landMoreFilterSections } from "../../constants/constants";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";
import SelectableButton from "@/ui/SelectableButton";
import { formatLabel } from "@/utilies/formatLabel";

type ListingOption = {
  label: "Buy" | "Rent";
  value: "sale" | "rent";
};

type LandMobileFilterProps = {
  open: boolean;
  onClose: () => void;
  listingOptions: readonly ListingOption[];
  categoryOptions: readonly categoryOption[];
};

const BUDGET_MIN = 5;
const BUDGET_MAX = 5000;
const BUDGET_STEP = 5;
const PLOT_AREA_MIN = 300;
const PLOT_AREA_MAX = 10000;

const budgetOptions = [
  5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 2000, 3000,
  4000, 5000,
];

const plotAreaOptions = [
  300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000,
];

const getCategoryLabel = (value: categoryOption) =>
  value === "Land" ? "Plots" : value;

const formatBudget = (value: number) =>
  value >= 100
    ? `₹${value / 100}${value === 5000 ? "+" : ""} Cr`
    : `₹${value} Lac`;

const postedByOptions: PostedByOption[] = ["Owners", "Agents", "Builders"];
const postedByLabelMap: Record<PostedByOption, string> = {
  Owners: "User",
  Agents: "Agent",
  Builders: "Builder",
};

const booleanLandKeys = new Set([
  "cornerPlot",
  "readyToConstruct",
  "waterConnection",
  "electricityConnection",
  "priceNegotiable",
]);

const LandMobileFilter: React.FC<LandMobileFilterProps> = ({
  open,
  onClose,
  listingOptions,
  categoryOptions,
}) => {
  const dispatch = useDispatch();
  const cityData = useAppSelector(selectCityWithLocalities);
  const { listingTypeLabel, category, searchText, minPrice, maxPrice, land } =
    useAppSelector((s) => s.filters);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LandFilterKey>("Land Type");
  const [budgetRange, setBudgetRange] = useState<[number | null, number | null]>([
    minPrice ?? null,
    maxPrice ?? null,
  ]);
  const [plotAreaRange, setPlotAreaRange] = useState<[number, number]>([
    land.plotArea?.min ?? PLOT_AREA_MIN,
    land.plotArea?.max ?? PLOT_AREA_MAX,
  ]);

  const selectedLocality = land.locality ?? "";
  const selectedLandTypes = Array.isArray(land.landType) ? land.landType : [];
  const selectedLandSubTypes = Array.isArray(land.landSubType) ? land.landSubType : [];
  const selectedPostedBy = land.createdByRole ? [land.createdByRole] : [];
  const dimensionLength = land.dimensions?.length;
  const dimensionWidth = land.dimensions?.width;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const navbar = document.querySelector(
      'nav[aria-label="Main navigation"]',
    ) as HTMLElement | null;
    const previousNavbarDisplay = navbar?.style.display;

    document.body.style.overflow = "hidden";
    if (navbar) {
      navbar.style.display = "none";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      if (navbar) {
        navbar.style.display = previousNavbarDisplay ?? "";
      }
    };
  }, [open]);

  useEffect(() => {
    setBudgetRange([minPrice ?? null, maxPrice ?? null]);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setPlotAreaRange([
      land.plotArea?.min ?? PLOT_AREA_MIN,
      land.plotArea?.max ?? PLOT_AREA_MAX,
    ]);
  }, [land.plotArea?.min, land.plotArea?.max]);

  const localitySuggestions = useMemo(() => {
    const names =
      cityData?.localities
        ?.map((loc) => loc?.name?.trim())
        .filter((name): name is string => Boolean(name)) ?? [];

    const query = searchText.trim().toLowerCase();
    if (!query) return names.slice(0, 8);

    const startsWith = names.filter((name) => name.toLowerCase().startsWith(query));
    const includes = names.filter(
      (name) =>
        !name.toLowerCase().startsWith(query) && name.toLowerCase().includes(query),
    );

    return [...startsWith, ...includes].slice(0, 8);
  }, [cityData, searchText]);

  const toggleArrayValue = (arr: string[] = [], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleLocalitySelect = (name: string) => {
    dispatch(setLandFilter({ key: "locality", value: name }));
    dispatch(setSearchText(""));
  };

  const applyBudget = (next: [number | null, number | null]) => {
    setBudgetRange(next);
    dispatch(
      setBudget({
        min: next[0] ?? null,
        max: next[1] ?? null,
      }),
    );
  };

  const updatePlotArea = (next: [number, number]) => {
    setPlotAreaRange(next);
    dispatch(
      setLandFilter({
        key: "plotArea",
        value: {
          min: next[0] === PLOT_AREA_MIN ? undefined : next[0],
          max: next[1] === PLOT_AREA_MAX ? undefined : next[1],
        },
      }),
    );
  };

  const handleClear = () => {
    dispatch(resetLandFilters());
    dispatch(setSearchText(""));
    dispatch(setBudget({ min: null, max: null }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#f5f6f5] lg:hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-2 py-5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <IoChevronBackOutline className="h-6 w-6 text-gray-700" />
          </button>
          <h2 className="font-bold text-gray-900">Filters</h2>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="pr-2 text-sm font-semibold text-green-600 transition-colors hover:text-green-700 active:text-green-800"
        >
          Reset
        </button>
      </div>

      <div className="h-[calc(100vh-180px)] space-y-5 overflow-y-auto px-4 py-4 pb-28">
        <div>
          <h3 className="mb-3 text-lg font-semibold">Listing Type</h3>
          <div className="flex gap-3">
            {listingOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  dispatch(setListingType({ label: option.label, value: option.value }))
                }
                className={`rounded-xl border px-6 py-2 text-sm ${listingTypeLabel === option.label
                    ? "border-green-600 bg-[#d8ece0] font-semibold text-green-700"
                    : "border-gray-300 bg-white"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Property Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map((type) => {
              const active = category === type;

              return (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-3 text-sm text-gray-900"
                >
                  <input
                    type="radio"
                    name="property-category-land-mobile"
                    value={type}
                    checked={active}
                    onChange={() => {
                      dispatch(setCategory(type));
                      if (type !== "Land") onClose();
                    }}
                    className="sr-only"
                  />

                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${active ? "border-green-600" : "border-gray-400"
                      }`}
                  >
                    {active && <span className="h-3 w-3 rounded-full bg-green-600" />}
                  </span>

                  {getCategoryLabel(type)}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">City / Locality</h3>
          <div className="flex items-center rounded-xl border border-gray-300 bg-white px-2 py-2">
            <IoIosSearch className="mr-2 text-xl text-gray-500" />
            <input
              type="text"
              placeholder={`Search in ${cityData?.city ?? "City"}`}
              value={searchText}
              onChange={(e) => dispatch(setSearchText(e.target.value))}
              className="w-full bg-transparent text-base outline-none"
            />
          </div>

          <h4 className="mb-3 mt-5 text-lg font-semibold">
            Localities in {cityData?.city ?? "City"}
          </h4>
          <div className="flex flex-wrap gap-2">
            {localitySuggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleLocalitySelect(name)}
                className={`rounded-xl px-3 py-2 text-sm ${selectedLocality === name
                    ? "bg-[#d8ece0] text-green-700"
                    : "bg-[#e1eae4] text-gray-900"
                  }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Budget</h3>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={budgetRange[0] ?? ""}
              onChange={(e) => {
                const newMin = e.target.value ? Number(e.target.value) : null;
                const currentMax = budgetRange[1];

                if (newMin !== null && currentMax !== null && newMin > currentMax) {
                  applyBudget([newMin, newMin]);
                  return;
                }

                applyBudget([newMin, currentMax]);
              }}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
            >
              <option value="">Minimum</option>
              {budgetOptions.map((v) => (
                <option
                  key={v}
                  value={v}
                  disabled={budgetRange[1] !== null && v > budgetRange[1]}
                >
                  {formatBudget(v)}
                </option>
              ))}
            </select>

            <select
              value={budgetRange[1] ?? ""}
              onChange={(e) => {
                const newMax = e.target.value ? Number(e.target.value) : null;
                const currentMin = budgetRange[0];

                if (currentMin !== null && newMax !== null && newMax < currentMin) {
                  applyBudget([newMax, newMax]);
                  return;
                }

                applyBudget([currentMin, newMax]);
              }}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
            >
              <option value="">Maximum</option>
              {budgetOptions.map((v) => (
                <option
                  key={v}
                  value={v}
                  disabled={budgetRange[0] !== null && v < budgetRange[0]}
                >
                  {formatBudget(v)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 px-1">
            <Range
              step={BUDGET_STEP}
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              values={[budgetRange[0] ?? BUDGET_MIN, budgetRange[1] ?? BUDGET_MAX]}
              onChange={(values) => {
                const [min, max] = values as [number, number];
                applyBudget([
                  min === BUDGET_MIN ? null : min,
                  max === BUDGET_MAX ? null : max,
                ]);
              }}
              renderTrack={({ props, children }) => {
                const { key, ...restProps } = props as React.HTMLProps<HTMLDivElement> & {
                  key?: React.Key;
                };

                return (
                  <div
                    key={key}
                    {...restProps}
                    className="h-1 w-full rounded"
                    style={{
                      background: getTrackBackground({
                        values: [budgetRange[0] ?? BUDGET_MIN, budgetRange[1] ?? BUDGET_MAX],
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
              renderThumb={({ props, isDragged }) => {
                const { key, ...restProps } = props as React.HTMLProps<HTMLDivElement> & {
                  key?: React.Key;
                };

                return (
                  <div
                    key={key}
                    {...restProps}
                    className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-600 shadow-md transition-transform focus:outline-none ${isDragged ? "scale-110 cursor-grabbing" : "cursor-grab"
                      } touch-none`}
                  >
                    <span className="h-2 w-0.5 rounded-full bg-white/90" />
                    <span className="ml-0.5 h-2 w-0.5 rounded-full bg-white/90" />
                  </div>
                );
              }}
            />
            <p className="mt-2 text-center text-xs text-gray-500">
              Drag handles to adjust budget range
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Land Type</h3>
          <div className="flex flex-wrap gap-2">
            {(landMoreFilterSections.find((section) => section.key === "Land Type")
              ?.options ?? []
            ).map((option) => {
              const active = selectedLandTypes.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setLandFilter({
                        key: "landType",
                        value: toggleArrayValue(selectedLandTypes, option),
                      }),
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-sm ${active
                      ? "border-green-600 bg-[#d8ece0] text-green-700"
                      : "border-gray-300 bg-white text-gray-900"
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Land Sub Type</h3>
          <div className="flex flex-wrap gap-2">
            {(landMoreFilterSections.find((section) => section.key === "Land Sub Type")
              ?.options ?? []
            ).map((option) => {
              const active = selectedLandSubTypes.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setLandFilter({
                        key: "landSubType",
                        value: toggleArrayValue(selectedLandSubTypes, option),
                      }),
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-sm ${active
                      ? "border-green-600 bg-[#d8ece0] text-green-700"
                      : "border-gray-300 bg-white text-gray-900"
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Posted By</h3>
          <div className="flex flex-wrap gap-3">
            {postedByOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  dispatch(
                    setLandFilter({
                      key: "createdByRole",
                      value: postedByLabelMap[option],
                    }),
                  )
                }
                className={`rounded-xl border px-3 py-2 text-sm ${selectedPostedBy.includes(postedByLabelMap[option])
                    ? "border-green-600 bg-[#d8ece0] text-green-700"
                    : "border-gray-300 bg-white"
                  }`}
              >
                {postedByLabelMap[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-lg font-semibold"
          >
            Advanced Filters (Optional)
            {showAdvanced ? (
              <IoChevronUpOutline className="h-6 w-6" />
            ) : (
              <IoChevronDownOutline className="h-6 w-6" />
            )}
          </button>

          {showAdvanced && (
            <div className="border-t border-gray-200">
              <div className="flex">
                <div className="w-1/3 border-r border-gray-200 bg-[#f7f8f7]">
                  {landMoreFilterSections.map((section) => (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setActiveFilter(section.key)}
                      className={`w-full border-b border-gray-200 px-3 py-3 text-left ${activeFilter === section.key
                          ? "bg-[#d8ece0] font-semibold text-green-700"
                          : "text-gray-800"
                        }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>

                <div className="w-2/3 p-3">
                  {landMoreFilterSections
                    .filter((section) => section.key === activeFilter)
                    .map((section) => {
                      const mappedKey = landKeyMapping[section.key];
                      const currentValue = land[mappedKey];
                      const isPostedByFilter = mappedKey === "createdByRole";

                      return (
                        <div key={section.key} className="space-y-3">
                          <h4 className="text-lg font-semibold text-gray-900">{section.label}</h4>

                          {section.key === "Verified Properties" ? (
                            <Toggle
                              enabled={Boolean(land.verifiedProperties)}
                              onChange={(val) => {
                                dispatch(
                                  setLandFilter({
                                    key: "verifiedProperties",
                                    value: val,
                                  }),
                                );
                                toast.success(
                                  val
                                    ? "Verified properties enabled"
                                    : "Verified properties disabled",
                                );
                              }}
                            />
                          ) : section.key === "Plot Area" ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={plotAreaRange[0]}
                                  onChange={(e) =>
                                    updatePlotArea([Number(e.target.value), plotAreaRange[1]])
                                  }
                                  className="rounded-xl border px-2 py-1 text-sm"
                                >
                                  {plotAreaOptions.map((v) => (
                                    <option key={v} value={v}>
                                      Min {v} sqft
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={plotAreaRange[1]}
                                  onChange={(e) =>
                                    updatePlotArea([plotAreaRange[0], Number(e.target.value)])
                                  }
                                  className="rounded-xl border px-2 py-1 text-sm"
                                >
                                  {plotAreaOptions.map((v) => (
                                    <option key={v} value={v}>
                                      Max {v} sqft
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <Range
                                step={50}
                                min={PLOT_AREA_MIN}
                                max={PLOT_AREA_MAX}
                                values={plotAreaRange}
                                onChange={(values) => updatePlotArea(values as [number, number])}
                                renderTrack={({ props, children }) => {
                                  const { key, ...restProps } = props as React.HTMLProps<HTMLDivElement> & {
                                    key?: React.Key;
                                  };

                                  return (
                                    <div
                                      key={key}
                                      {...restProps}
                                      className="h-1 w-full rounded bg-gray-200"
                                    >
                                      {children}
                                    </div>
                                  );
                                }}
                                renderThumb={({ props }) => {
                                  const { key, ...restProps } = props as React.HTMLProps<HTMLDivElement> & {
                                    key?: React.Key;
                                  };

                                  return (
                                    <div
                                      key={key}
                                      {...restProps}
                                      className="h-4 w-4 rounded-full bg-green-600 shadow"
                                    />
                                  );
                                }}
                              />
                            </div>
                          ) : section.key === "Dimensions" ? (
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="mb-1 block text-xs text-gray-600">
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
                                      }),
                                    );
                                  }}
                                  className="w-full rounded-xl border px-3 py-2 text-sm"
                                  placeholder="e.g. 40"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs text-gray-600">
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
                                      }),
                                    );
                                  }}
                                  className="w-full rounded-xl border px-3 py-2 text-sm"
                                  placeholder="e.g. 60"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {section.options?.map((opt) => {
                                const isBooleanFilter = booleanLandKeys.has(mappedKey);
                                const postedByValue = isPostedByFilter
                                  ? postedByLabelMap[opt as PostedByOption] ?? opt
                                  : opt;
                                const selectedValues = Array.isArray(currentValue)
                                  ? (currentValue as string[])
                                  : [];
                                const active = isBooleanFilter
                                  ? Boolean(currentValue)
                                  : isPostedByFilter
                                    ? Array.isArray(currentValue) &&
                                      selectedValues.includes(postedByValue)
                                  : section.selectionType === "multiple"
                                    ? Array.isArray(currentValue) && selectedValues.includes(opt)
                                    : currentValue === opt;

                                return (
                                  <SelectableButton
                                    key={opt}
                                    label={
                                      isPostedByFilter
                                        ? postedByValue
                                        : formatLabel(opt)
                                    }
                                    active={active}
                                    selectionType={section.selectionType ?? "single"}
                                    showIndicator={isPostedByFilter}
                                    onClick={() =>
                                      dispatch(
                                        setLandFilter({
                                          key: mappedKey,
                                          value: isBooleanFilter
                                            ? !Boolean(currentValue)
                                            : isPostedByFilter
                                              ? active
                                                ? ""
                                                : postedByValue
                                            : section.selectionType === "multiple"
                                              ? toggleArrayValue(
                                                selectedValues,
                                                opt,
                                              )
                                              : opt,
                                        }),
                                      )
                                    }
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
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex gap-4 border-t border-gray-200 bg-white p-4">
        <button
          type="button"
          className="flex-1 rounded-xl border border-green-600 py-2 text-lg font-semibold text-green-600"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          type="button"
          className="flex-1 rounded-2xl bg-green-600 py-2 text-xl font-semibold text-white"
          onClick={onClose}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default LandMobileFilter;
