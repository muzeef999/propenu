"use client";

import React, { useState } from "react";
import { IoIosSearch } from "react-icons/io";
import { useDispatch } from "react-redux";
import FilterDropdown from "@/ui/FilterDropdown";
import { useAppSelector } from "@/Redux/store";
import {
  categoryOption,
  setAgriculturalFilter,
  setCategory,
  setCommercialFilter,
  setLandFilter,
  setListingType,
  setSearchText,
} from "@/Redux/slice/filterSlice";
import { ArrowDropdownIcon } from "@/icons/icons";
import CategoryFilters from "./CategoryFilters";
import {
  agriculturalMoreFilterSections,
  commercialMoreFilterSections,
  landMoreFilterSections,
} from "./constants/constants";

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
  const [propertyTypeOpen, setPropertyTypeOpen] = useState(false);

  const dispatch = useDispatch();
  const { listingTypeLabel, category, searchText, commercial, land, agricultural } =
    useAppSelector((s) => s.filters);

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

  return (
    <div className="sticky top-0 z-20 flex h-14 items-center bg-[#D1EFDD] px-3 shadow-sm">
      <div className="sticky top-0 z-999">
        <div className="mx-auto flex h-14 items-center gap-4 px-4">

          {/* Listing Type + Category */}
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
          </div>

          {/* Search */}
          <div className="flex items-center w-72 rounded-full bg-white px-3 py-2 shadow-sm">
            <IoIosSearch className="mr-2 text-lg text-gray-500" />
            <input
              type="text"
              placeholder="En Loca"
              value={searchText}
              onChange={(e) => dispatch(setSearchText(e.target.value))}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* Dynamic Category Filters */}
          <CategoryFilters />

        </div>
      </div>

    </div>
  );
};

export default FilterBar;
