"use client";
import { categoryOption } from "@/types";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAppSelector } from "@/Redux/store";
import { useDispatch } from "react-redux";
import {
  setAgriculturalFilter,
  setCategory,
  setCommercialFilter,
  setLandFilter,
  setListingType,
  setResidentialFilter,
  setSearchText,
} from "@/Redux/slice/filterSlice";
import { selectCityWithLocalities } from "@/Redux/slice/citySlice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDropdownIcon } from "@/icons/icons";
import { IoIosSearch } from "react-icons/io";

const listingOptions = [
  { label: "Buy", value: "sale" },
  { label: "Rent", value: "rent" },
] as const;

const SearchBox = () => {
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { listingTypeLabel, listingTypeValue, category, searchText, residential, commercial, land, agricultural } = useAppSelector((s) => s.filters);
  const cityData = useAppSelector(selectCityWithLocalities);

  const categoryOptions: Array<{ label: string; value: categoryOption }> = [
    { label: "Residential", value: "Residential" },
    { label: "Commercial", value: "Commercial" },
    { label: "Plots", value: "Land" },
    { label: "Agricultural", value: "Agricultural" },
  ];
  const categoryToType: Record<categoryOption, string> = {
    Residential: "residential",
    Commercial: "commercial",
    Land: "land",
    Agricultural: "agricultural",
  };

  const dispatch = useDispatch();
  const router = useRouter();
  const toggleArrayValue = (arr: string[] = [], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

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

  const buildPropertiesHref = (
    localities: string[] = selectedLocalities,
    text: string = searchText,
  ) => {
    const params = new URLSearchParams({
      type: categoryToType[category],
      listingType: listingTypeValue,
    });

    const cleanedLocalities = localities
      .map((locality) => locality.trim())
      .filter(Boolean);

    if (cleanedLocalities.length > 0) {
      params.set("locality", cleanedLocalities.join(","));
    }

    const cleanedSearch = text.trim();
    if (cleanedSearch && cleanedLocalities.length === 0) {
      params.set("search", cleanedSearch);
    }

    if (cityData?.city) params.set("city", cityData.city);
    if (cityData?.state) params.set("state", cityData.state);

    return `/properties?${params.toString()}`;
  };

  const handleLocalitySelect = (name: string) => {
    const nextLocalities = toggleArrayValue(selectedLocalities, name);

    if (category === "Residential") {
      dispatch(
        setResidentialFilter({
          key: "locality",
          value: nextLocalities,
        }),
      );
    } else if (category === "Commercial") {
      dispatch(
        setCommercialFilter({
          key: "locality",
          value: nextLocalities,
        }),
      );
    } else if (category === "Land") {
      dispatch(setLandFilter({ key: "locality", value: nextLocalities }));
    } else {
      dispatch(setAgriculturalFilter({ key: "locality", value: nextLocalities }));
    }

    dispatch(setSearchText(""));
    setSearchOpen(false);
    router.push(buildPropertiesHref(nextLocalities, ""));
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
    <div className="relative w-full max-w-2xl">
      <div className=" block bg-white shadow-lg rounded-xl border border-gray-200 p-2 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded-md cursor-pointer bg-[#D1EFDD] px-3 py-1.5 text-sm font-medium text-[#15803D] transition-colors hover:bg-[#BDE5CE]"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
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

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCategoryOpen((prev) => !prev);
              }}
              className="flex items-center gap-2 bg-transparent text-sm text-gray-900 cursor-pointer"
            >
              <span className="md:max-w-24 md:truncate lg:max-w-none">
                {category === "Land" ? "Plots" : category}
              </span>
              <ArrowDropdownIcon
                size={12}
                color="#111827"
                className={`transition-transform duration-200 ${
                  categoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {categoryOpen && (
              <div
                className="absolute left-0 top-[calc(100%+8px)] z-60 w-44 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute -top-2 left-6 pointer-events-none">
                  <div className="h-3 w-3 rotate-45 bg-white border-l border-t border-gray-200" />
                </div>
                <h4 className="mb-2 text-sm font-semibold">Category</h4>
                <div className="flex flex-col gap-1">
                  {categoryOptions.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        dispatch(setCategory(value));
                        setCategoryOpen(false);
                      }}
                      className={`rounded px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                        category === value
                          ? "bg-[#D1EFDD] text-[#15803D] font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="md:block h-6 w-px bg-gray-200" />

          {/* Search Input */}
          <div ref={searchDropdownRef} className="relative grow min-w-0">
            <div className="md:flex grow items-center min-w-0 cursor-text">
              <IoIosSearch className="mr-2 text-lg text-gray-500 hidden sm:inline" />
              <input
                type="text"
                value={searchText}
                onFocus={() => setSearchOpen(true)}
                onClick={() => setSearchOpen(true)}
                onChange={(e) => {
                  dispatch(setSearchText(e.target.value));
                  setSearchOpen(true);
                }}
                placeholder={placeholder}
                className="w-full bg-transparent pl-2 text-sm outline-none"
              />
            </div>

            {searchOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-70 w-[360px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
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
                            setSearchOpen(false);
                          }}
                          className="text-left text-sm cursor-pointer text-gray-800 hover:text-primary"
                        >
                          {name},{" "}
                          <span className="text-[#26ad5f]">
                            {cityData.city}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              </div>
            )}
          </div>

          <Link href={buildPropertiesHref()} className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0">
            <IoIosSearch className="h-5 w-5" />
            <span className="hidden sm:inline">Search</span>
          </Link>
        </div>

        {open && (
          <div
            className="absolute left-2 top-[calc(100%+8px)] z-60 w-38 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-2 text-sm font-semibold">Listing Type</h4>
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
                    setOpen(false);
                  }}
                  className="rounded px-2 py-1 hover:bg-gray-100 cursor-pointer"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBox;
