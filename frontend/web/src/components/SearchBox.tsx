"use client";
import { categoryOption } from "@/types";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/Redux/store";
import { useDispatch } from "react-redux";
import { setCategory } from "@/Redux/slice/filterSlice";
import Link from "next/link";
import { ArrowDropdownIcon } from "@/icons/icons";
import { IoIosSearch } from "react-icons/io";

const listingOptions = [
  { label: "Buy", value: "sale" },
  { label: "Rent", value: "rent" },
  { label: "Lease", value: "lease" },
] as const;

const CATEGORY_OPTIONS = [
  "All Residential",
  "All Agricultural",
  "All Commercial",
  "All Land/Plot",
];

const SearchBox = () => {
  const [open, setOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState(
    "Search for city, locality, project..."
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // 'md' breakpoint for mobile and tabs
        setPlaceholder("Search...");
      } else {
        setPlaceholder("Search for city, locality, project...");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { listingTypeLabel, category } = useAppSelector((s) => s.filters);

  const categoryOptions: categoryOption[] = [
    "Residential",
    "Commercial",
    "Land",
    "Agricultural",
  ];

  const dispatch = useDispatch();

  const searchParams = new URLSearchParams({ focus: "search" });

  return (
    <div className="relative w-full max-w-2xl">
      <Link
        href={`/properties?${searchParams.toString()}`}
        className="block bg-white shadow-lg rounded-xl border border-gray-200 p-2 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded-md bg-[#D1EFDD] px-3 py-1.5 text-sm font-medium text-[#15803D] transition-colors hover:bg-[#BDE5CE]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="leading-none">{listingTypeLabel}</span>

            <ArrowDropdownIcon
              size={12}
              color="#15803D"
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""
                }`}
            />
          </button>

          <span className="h-6 w-px bg-gray-200" />

          <select
            value={category}
            onChange={(e) =>
              dispatch(setCategory(e.target.value as categoryOption))
            }
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent text-sm outline-none cursor-pointer"
          >
            {categoryOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <span className="md:block h-6 w-px bg-gray-200" />

          {/* Search Input */}
          <div className="md:flex grow items-center">
            <IoIosSearch className="mr-2 text-lg text-gray-500 hidden sm:inline" />
            <input
              type="text"
              placeholder={placeholder}
              className="w-full bg-transparent pl-2 text-sm outline-none"
            />
          </div>

          <div className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0">
            <IoIosSearch className="h-5 w-5" />
            <span className="hidden sm:inline">Search</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SearchBox;
