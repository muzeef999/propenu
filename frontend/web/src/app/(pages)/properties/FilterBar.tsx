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
      <div className="mx-auto w-full max-w-8xl flex items-center gap-5 rounded-xl bg-white px-4 py-1">
        <div className="flex items-center gap-4 w-full justify-between">
          <div className="flex items-center rounded-md">
            <div className="flex items-center">
              <FilterDropdown
                open={open}
                onOpenChange={setOpen}
                triggerLabel={
                  <span className="px-3 py-1.5 text-sm font-medium text-primary">
                    {listingTypeLabel}
                  </span>
                }
                width="w-56"
                align="left"
                renderContent={(close) => (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Listing Type</h4>
                    <div className="flex flex-wrap gap-2 text-primary">
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
                          className={`rounded px-2 py-1 hover:bg-gray-100 ${listingTypeLabel === l.label ? "font-semibold" : ""
                            }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              />

              <ArrowDropdownIcon
                size={12}
                color="#27AE60"
                className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"
                  }`}
              />
            </div>

            <span className="h-6 w-px bg-gray-200" />

            <div>
              <select
                value={category}
                onChange={(e) =>
                  dispatch(setCategory(e.target.value as categoryOption))
                }
                className="w-full max-w-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center w-64 rounded-md bg-gray-100 px-2">
            <IoIosSearch className="mr-2 text-xl shrink-0" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchText}
              onChange={(e) => dispatch(setSearchText(e.target.value))}
              className="w-full bg-transparent px-2 py-1 outline-none"
            />
          </div>



          <CategoryFilters />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
