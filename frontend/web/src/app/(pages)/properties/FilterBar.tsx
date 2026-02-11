// components/FilterBar.tsx
"use client";
import React, { useState } from "react";
import FilterDropdown from "@/ui/FilterDropdown";
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
import { ArrowDropdownIcon } from "@/icons/icons";

const FilterBar: React.FC = () => {
  const listingOptions = [
    { label: "Buy", value: "sale" },
    { label: "Rent", value: "rent" },
  ] as const;

  const [open, setOpen] = useState(false);

  const categoryOptions: categoryOption[] = [
    "Residential",
    "Commercial",
    "Land",
    "Agricultural",
  ];

  const dispatch = useDispatch();
  const { listingTypeLabel, category, searchText } = useAppSelector(
    (s) => s.filters,
  );

  return (
    <div className="sticky top-0 w-full h-14 px-3 flex items-center z-20 shadow-sm bg-[#D1EFDD]">
      <div className="max-w-8xl mx-auto bg-white flex gap-5  items-center border-none rounded-xl px-3 py-1">
        <div className="flex items-center gap-4">
          <div className=" flex items-center rounded-md ">
            <div className="flex items-center">
              <FilterDropdown
                open={open} // 🔥 parent controls state
                onOpenChange={setOpen} // 🔥 dropdown reports changes
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
                              setListingType({
                                label: l.label,
                                value: l.value,
                              }),
                            );
                            close(); // 🔥 closes dropdown AND arrow
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

              <ArrowDropdownIcon
                size={12}
                color="#27AE60"
                className={`transition-transform duration-200 shrink-0 ${
                  open ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            <span className="w-px h-6 bg-gray-200" />

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
