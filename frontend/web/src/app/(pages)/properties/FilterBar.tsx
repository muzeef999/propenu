// components/FilterBar.tsx
"use client";
import React from "react";
import FilterDropdown from "@/ui/FilterDropdown";
import { hexToRGBA } from "@/ui/hexToRGBA";
import { IoIosSearch } from "react-icons/io";

import {
  setListingType,
  setCategory,
  setSearchText,
  categoryOption,
} from "@/Redux/slice/filterSlice";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/Redux/store";
import CategoryFilters from "./CategoryFilters";

const FilterBar: React.FC = () => {
  const bgColor = hexToRGBA("#27AE60", 0.2);

  const listingOptions = [
    { label: "Buy", value: "buy" },
    { label: "Rent", value: "rent" },
    { label: "Lease", value: "lease" },
  ] as const;

  const categoryOptions: categoryOption[] = [
    "Residential",
    "Commercial",
    "Land",
    "Agricultural",
  ];

  const dispatch = useDispatch();
  const { listingTypeLabel, category, searchText } = useAppSelector(
    (s) => s.filters
  );

  return (
    <div
      className="sticky top-0 w-full h-14 px-3 flex items-center   z-60 shadow-sm"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-8xl mx-auto bg-white flex gap-5  items-center border-none rounded-xl px-3 py-1">
        <div className="flex items-center gap-4">
          <FilterDropdown
            triggerLabel={
              <span className="px-3 py-1.5 text-sm text-primary font-medium">
                {listingTypeLabel}
              </span>
            }
            width="w-56"
            align="left"
            renderContent={(close) => (
              <div>
                <h4 className="text-sm font-semibold mb-2">Listing Type</h4>
                <div className="flex gap-2 flex-wrap text-primary">
                  {listingOptions.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => {
                        dispatch(
                          setListingType({ label: l.label, value: l.value })
                        );
                        close?.();
                      }}
                      className={`px-2 py-1 rounded hover:bg-gray-100 ${
                        listingTypeLabel === l.label ? "font-semibold" : ""
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />

          <div>
            <select
              value={category}
              onChange={(e) =>
                dispatch(setCategory(e.target.value as categoryOption))
              }
              className="w-full max-w-lg rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {categoryOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-gray-100 rounded-md px-2">
            <IoIosSearch className="text-xl mr-2" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchText}
              onChange={(e) => dispatch(setSearchText(e.target.value))}
              className="bg-transparent outline-none px-2 py-1"
            />
          </div>

          <CategoryFilters />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
