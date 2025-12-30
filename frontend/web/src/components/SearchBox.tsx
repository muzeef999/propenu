"use client";
import { useState, useEffect } from "react";
import { useCity } from "@/hooks/useCity";
import { ListingOption, LocationItem, categoryOption } from "@/types";
import Image from "next/image";
import Link from "next/link";
import heroBanner from "@/asserts/heroBanner.png";
import FilterDropdown from "@/ui/FilterDropdown";
import { setCategory, setListingType,  } from "@/Redux/slice/filterSlice";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/Redux/store";
import { CiSearch } from "react-icons/ci";

const listingOptions: ListingOption[] = ["Buy", "Rent", "Lease"];

const CATEGORY_OPTIONS = [
  "All Residential",
  "All Agricultural",
  "All Commercial",
  "All Land/Plot",
];

const SearchBox = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationItem[]>([]);
  const { selectCity  } = useCity();

  const { listingTypeLabel, category } = useAppSelector(
    (s) => s.filters
  );

  const categoryOptions: categoryOption[] = [
    "Residential",
    "Commercial",
    "Land",
    "Agricultural",
  ];

  const dispatch = useDispatch();

  function handleSelect(item: LocationItem) {
    selectCity(item);
    setQuery(item?.city);
    setResults([]);
  }

  return (
    <div className="relative w-full">
      {/* Banner */}
      <Image
        src={heroBanner}
        className="w-full h-auto"
        alt="hero sections"
        priority
      />

      {/* Search Box floating ABOVE banner */}
      <div className="absolute top-[70%] left-1/2 -translate-x-1/2  w-[50%]">
        <div className="bg-white shadow-md rounded-lg border border-gray-200 p-2">
          {/* Search Row */}
          <div className="flex items-center gap-3 relative">
            <div className="border-r border-r-[#EBEBEB] pr-3">
              <FilterDropdown
                triggerLabel={
                  <span className="px-4 text-primary font-medium">
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
                          key={l}
                          onClick={() => {
                           dispatch(setListingType({ label: "Buy", value: "buy" }));
                            close?.();
                          }}
                          className={`px-2 py-1 rounded hover:bg-gray-100 ${
                            listingTypeLabel === l ? "font-semibold" : ""
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              />
            </div>

            <select
              value={category}
              onChange={(e) =>
                dispatch(setCategory(e.target.value as categoryOption))
              }
              className="rounded-lg focus:ring-2  focus:outline-none"
            >
              {categoryOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <div className="relative w-full border-l border-l-[#EBEBEB] pl-3">
              <CiSearch
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="project, or builder..."
                className="w-full rounded-lg pl-10 pr-4 py-2 text-sm outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Link
                href="/properties"
                className="absolute right-0 bg-[#27AE60] text-white px-4 py-2 rounded-lg"
              >
                Search
              </Link>
            </div>
          </div>

          {/* Dropdown List */}
          {results.length > 0 && (
            <ul className="absolute top-full mt-2 left-0 w-full bg-white border rounded-xl shadow-lg max-h-64 overflow-y-auto text-sm">
              {results.map((item) => (
                <li
                  key={item._id}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="text-gray-700">{item?.city}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBox;
