"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoIosSearch } from "react-icons/io";
import { useDispatch } from "react-redux";
import FilterDropdown from "@/ui/FilterDropdown";
import { useAppSelector } from "@/Redux/store";
import { selectCityWithLocalities } from "@/Redux/slice/citySlice";
import {
  categoryOption,
  setAgriculturalFilter,
  setCategory,
  setCommercialFilter,
  setLandFilter,
  setListingType,
  setResidentialFilter,
  setSearchText,
} from "@/Redux/slice/filterSlice";
import { ArrowDropdownIcon } from "@/icons/icons";
import CategoryFilters from "./CategoryFilters";
import {
  agriculturalMoreFilterSections,
  commercialMoreFilterSections,
  landMoreFilterSections,
} from "./constants/constants";
import { IoCloseCircleOutline } from "react-icons/io5";

const FilterBar: React.FC = () => {
  const listingOptions = [
    { label: "Buy", value: "sale" },
    { label: "Rent", value: "rent" },
  ] as const;

  const categoryOptions: categoryOption[] = [
    "Residential",
    "Commercial",
    "Land",
    "Agricultural",
  ];

  const [open, setOpen] = useState(false);
const [searchOpen, setSearchOpen] = useState(false);

  const dispatch = useDispatch();
  const {
    listingTypeLabel,
    category,
    searchText,
    residential,
    commercial,
    land,
    agricultural,
  } =
    useAppSelector((s) => s.filters);
  const cityData = useAppSelector(selectCityWithLocalities);

  const toggleArrayValue = (arr: string[] = [], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const commercialTypeOptions =
    commercialMoreFilterSections.find((section) => section.key === "Commercial Type")
      ?.options ?? [];
  const landTypeOptions =
    landMoreFilterSections.find((section) => section.key === "Land Type")
      ?.options ?? [];
  const agriculturalTypeOptions =
    agriculturalMoreFilterSections.find(
      (section) => section.key === "Agricultural Type",
    )?.options ?? [];

  const propertyTypeOptionsByCategory: Partial<Record<categoryOption, string[]>> =
  {
    Commercial: commercialTypeOptions,
    Land: landTypeOptions,
    Agricultural: agriculturalTypeOptions,
  };

  const selectedPropertyTypes =
    category === "Commercial"
      ? Array.isArray(commercial.commercialType)
        ? commercial.commercialType
        : []
      : category === "Land"
        ? Array.isArray(land.landType)
          ? land.landType
          : []
        : category === "Agricultural"
          ? Array.isArray(agricultural.agriculturalType)
            ? agricultural.agriculturalType
            : []
          : [];

  const propertyTypeLabel =
    selectedPropertyTypes.length === 0
      ? "Property Type"
      : selectedPropertyTypes.length === 1
        ? selectedPropertyTypes[0]
        : `${selectedPropertyTypes.length} Types`;

  const handlePropertyTypeToggle = (value: string) => {
    if (category === "Commercial") {
      dispatch(
        setCommercialFilter({
          key: "commercialType",
          value: toggleArrayValue(selectedPropertyTypes, value),
        }),
      );
      return;
    }

    if (category === "Land") {
      dispatch(
        setLandFilter({
          key: "landType",
          value: toggleArrayValue(selectedPropertyTypes, value),
        }),
      );
      return;
    }

    if (category === "Agricultural") {
      dispatch(
        setAgriculturalFilter({
          key: "agriculturalType",
          value: toggleArrayValue(selectedPropertyTypes, value),
        }),
      );
    }
  };

  const clearPropertyTypes = () => {
    if (category === "Commercial") {
      dispatch(setCommercialFilter({ key: "commercialType", value: [] }));
      return;
    }

    if (category === "Land") {
      dispatch(setLandFilter({ key: "landType", value: [] }));
      return;
    }

    if (category === "Agricultural") {
      dispatch(setAgriculturalFilter({ key: "agriculturalType", value: [] }));
    }
  };

  const selectedLocalities = useMemo(() => {
    if (category === "Residential") {
      return Array.isArray(residential.locality) ? residential.locality : [];
    }

    if (category === "Commercial") {
      if (Array.isArray(commercial.locality)) return commercial.locality;
      return commercial.locality ? [commercial.locality] : [];
    }

    if (category === "Land") {
      if (Array.isArray(land.locality)) return land.locality;
      return land.locality ? [land.locality] : [];
    }

    if (Array.isArray(agricultural.locality)) return agricultural.locality;
    return agricultural.locality ? [agricultural.locality] : [];
  }, [category, residential.locality, commercial.locality, land.locality, agricultural.locality]);

  const handleLocalitySelect = (name: string) => {
    if (category === "Residential") {
      dispatch(
        setResidentialFilter({
          key: "locality",
          value: toggleArrayValue(selectedLocalities, name),
        }),
      );
    } else if (category === "Commercial") {
      dispatch(
        setCommercialFilter({
          key: "locality",
          value: toggleArrayValue(selectedLocalities, name),
        }),
      );
    } else if (category === "Land") {
      dispatch(setLandFilter({ key: "locality", value: name }));
    } else {
      dispatch(setAgriculturalFilter({ key: "locality", value: name }));
    }

    dispatch(setSearchText(""));
    setSearchOpen(true);
  };

  const handleRemoveLocality = (name: string) => {
    const next = selectedLocalities.filter((loc) => loc !== name);

    if (category === "Residential") {
      dispatch(setResidentialFilter({ key: "locality", value: next }));
    } else if (category === "Commercial") {
      dispatch(setCommercialFilter({ key: "locality", value: next }));
    } else if (category === "Land") {
      dispatch(setLandFilter({ key: "locality", value: "" }));
    } else {
      dispatch(setAgriculturalFilter({ key: "locality", value: "" }));
    }
  };

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

  return (
    <div className="sticky top-0 z-10 w-full bg-[#D1EFDD] px-3 shadow-sm container">
      <div className="mx-auto flex h-14 items-center gap-4 px-4">
        {/* Listing Type + Category + Search */}
        <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">

          {/* Listing Type */}
          <div className="flex items-center gap-2">
            <FilterDropdown
              open={open}
              onOpenChange={setOpen}
              triggerLabel={
                <div className="flex items-center gap-1 text-sm font-medium cursor-pointer">
                  <span>{listingTypeLabel}</span>
                  <ArrowDropdownIcon
                    size={12}
                    className={`transition-transform duration-200 ${open ? "rotate-180" : ""
                      }`}
                  />
                </div>
              }
              width="w-56"
              align="left"
              renderContent={(close) => (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">
                    Listing Type
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {listingOptions.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => {
                          dispatch(
                            setListingType({
                              label: l.label,
                              value: l.value,
                            }),
                          );
                          close();
                        }}
                        className="rounded px-2 py-1 hover:bg-gray-100"
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            />
          </div>


          <span className="h-5 w-px bg-gray-200" />

          {/* Category */}
          <select
            value={category}
            onChange={(e) =>
              dispatch(setCategory(e.target.value as categoryOption))
            }
            className="bg-transparent text-sm outline-none"
          >
            {categoryOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <span className="h-5 w-px bg-gray-200" />
          <FilterDropdown
            open={searchOpen}
            onOpenChange={setSearchOpen}
            align="left"
            width="w-[360px]"
            showArrow={false}
            triggerLabel={
              <div className="flex items-center cursor-text">
                <IoIosSearch className="mr-2 text-lg text-gray-500" />

                {selectedLocalities.length > 0 && (
                  <div className="mr-2 flex items-center gap-2">
                    <span className="flex max-w-36 items-center gap-2 rounded-full bg-[#f2e7e7] px-3 py-1 text-sm text-gray-800">
                      <span className="truncate">{selectedLocalities[0]}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLocality(selectedLocalities[0]);
                        }}
                        className="shrink-0 text-gray-600 hover:text-gray-900"
                      >
                        <IoCloseCircleOutline className="h-4 w-4" />
                      </button>
                    </span>

                    {selectedLocalities.length > 1 && (
                      <span className="rounded-full bg-[#f2e7e7] px-3 py-1 text-sm text-gray-700">
                        +{selectedLocalities.length - 1}
                      </span>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  placeholder={
                    selectedLocalities.length > 0
                      ? "Add More"
                      : "Enter Locality or Landmark"
                  }
                  value={searchText}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    dispatch(setSearchText(e.target.value));
                    setSearchOpen(true);
                  }}
                  className={`bg-transparent text-sm outline-none ${selectedLocalities.length > 0 ? "w-28" : "w-72"
                    }`}
                />
              </div>
            }
            renderContent={(close) => (
              <div className="space-y-3">
                {!cityData && (
                  <p className="text-sm text-gray-500">
                    Please select a city to see popular localities.
                  </p>
                )}

                {cityData && (
                  <>
                    <p className="text-sm font-semibold text-gray-700">
                      Top Localities in {cityData.city}
                    </p>

                    {localitySuggestions.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No locality found for &quot;{searchText}&quot;
                      </p>
                    )}

                    <div className="flex flex-col gap-2">
                      {localitySuggestions.map((name) => (
                        <button
                          key={name}
                          onClick={() => {
                            handleLocalitySelect(name);
                            close();
                          }}
                          className="text-left text-sm text-gray-800 hover:text-primary"
                        >
                          {name},{" "}
                          <span className="text-red-600">
                            {cityData.city}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          />

        </div>

        {/* Dynamic Category Filters */}
        <CategoryFilters />

      </div>
    </div>
  );
};

export default FilterBar;
