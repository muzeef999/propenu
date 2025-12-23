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
  ListingOption,
  categoryOption,
} from "@/Redux/slice/filterSlice";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/Redux/store";
import CategoryFilters from "./CategoryFilters";

const FilterBar: React.FC = () => {
  const bgColor = hexToRGBA("#27AE60", 0.1); 

  const listingOptions: ListingOption[] = ["Buy", "Rent", "Lease"];
  const categoryOptions: categoryOption[] = [
    "Residential",
    "Commercial",
    "Land",
    "Agricultural",
  ];

  const dispatch = useDispatch();
  const { listingType, category, searchText } = useAppSelector((s) => s.filters);

  return (
    <div className="w-full h-[60px] flex items-center" style={{ backgroundColor: bgColor }}>
      <div className="container bg-[#FFF] flex gap-6 p-2 items-center border-none rounded-xl">
        <div className="flex items-center gap-4">
          <FilterDropdown
            triggerLabel={<span className="px-4 text-primary font-medium">{listingType}</span>}
            width="w-56"
            align="left"
            openOnHover={true}
            renderContent={(close) => (
              <div>
                <h4 className="text-sm font-semibold mb-2">Listing Type</h4>
                <div className="flex gap-2 flex-wrap text-primary">
                  {listingOptions.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        dispatch(setListingType(l));
                        close?.();
                      }}
                      className={`px-2 py-1 rounded hover:bg-gray-100 ${
                        listingType === l ? "font-semibold" : ""
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />

          <div>
            <select
              value={category}
              onChange={(e) => dispatch(setCategory(e.target.value as categoryOption))}
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
        </div>
          <div>
             <CategoryFilters />
          </div>
      </div>
    </div>
  );
};

export default FilterBar;
