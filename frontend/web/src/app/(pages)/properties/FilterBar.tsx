"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { IoIosSearch } from "react-icons/io";
import { useDispatch } from "react-redux";
import FilterDropdown from "@/ui/FilterDropdown";
import { useAppSelector } from "@/Redux/store";
import { selectCityWithLocalities, setCityId } from "@/Redux/slice/citySlice";
import {
  categoryOption,
  resetAgriculturalFilters,
  resetCommercialFilters,
  resetLandFilters,
  resetResidentialFilters,
  setAgriculturalFilter,
  setBudget,
  setCategory,
  setCommercialFilter,
  setLandFilter,
  setListingType,
  setResidentialFilter,
  setSearchText,
} from "@/Redux/slice/filterSlice";
import { ArrowDropdownIcon } from "@/icons/icons";
import CategoryFilters from "./CategoryFilters";
import { IoCloseCircleOutline } from "react-icons/io5";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import ResidentialMobileFilters from "./filters/adaptiveFilterDesign/ResidentialMobileFilters";
import CommercialMobileFilter from "./filters/adaptiveFilterDesign/CommercialMobileFilter";
import LandMobileFilter from "./filters/adaptiveFilterDesign/LandMobileFilter";
import AgriculturalMobileFilter from "./filters/adaptiveFilterDesign/AgriculturalMobileFilter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildSearchParams } from "./filters/buildSearchParams";
import { hydrateFiltersFromSearchParams } from "./filters/hydrateFiltersFromSearchParams";

const LAST_PROPERTY_CATEGORY_KEY = "properties:lastCategory";

function normalizeLocalityName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getLocalityDedupKey(value: string) {
  return normalizeLocalityName(value).toLowerCase();
}

const FilterBar: React.FC = () => {
  const getCategoryLabel = (value: categoryOption) =>
    value === "Land" ? "Plots" : value;

  const categoryToType: Record<categoryOption, string> = {
    Residential: "residential",
    Commercial: "commercial",
    Land: "plot",
    Agricultural: "agricultural",
  };

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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showResidentialAdvanced, setShowResidentialAdvanced] = useState(false);
  const [showCommercialAdvanced, setShowCommercialAdvanced] = useState(false);
  const [showLandAdvanced, setShowLandAdvanced] = useState(false);
  const [showAgriculturalAdvanced, setShowAgriculturalAdvanced] = useState(false);
  const [hasRestoredCategory, setHasRestoredCategory] = useState(false);
  const [hasHydratedFromUrl, setHasHydratedFromUrl] = useState(false);
  const pendingInitialUrlCategoryRef = useRef<categoryOption | null>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    listingTypeLabel,
    listingTypeValue,
    category,
    searchText,
    minPrice,
    maxPrice,
    residential,
    commercial,
    land,
    agricultural,
  } =
    useAppSelector((s) => s.filters);
  const cityData = useAppSelector(selectCityWithLocalities);
  const locations = useAppSelector((s) => s.city.locations);
  const urlSearchPayload = useMemo(
    () => ({
      ...buildSearchParams({
        listingTypeLabel,
        listingTypeValue,
        category,
        searchText,
        minPrice,
        maxPrice,
        residential,
        commercial,
        land,
        agricultural,
      }),
      city: cityData?.city || undefined,
      state: cityData?.state || undefined,
    }),
    [
      listingTypeLabel,
      listingTypeValue,
      category,
      searchText,
      minPrice,
      maxPrice,
      residential,
      commercial,
      land,
      agricultural,
      cityData?.city,
      cityData?.state,
    ],
  );
  const hydratedUrlCategory = useMemo(
    () =>
      hydrateFiltersFromSearchParams(
        new URLSearchParams(searchParams.toString()),
      ).category,
    [searchParams],
  );

  useEffect(() => {
    const hydrated = hydrateFiltersFromSearchParams(
      new URLSearchParams(searchParams.toString()),
    );
    let resolvedCategory: categoryOption | null = null;

    if (!hydrated.category) {
      const savedCategory = window.sessionStorage.getItem(
        LAST_PROPERTY_CATEGORY_KEY,
      ) as categoryOption | null;

      if (savedCategory && categoryOptions.includes(savedCategory)) {
        dispatch(setCategory(savedCategory));
        resolvedCategory = savedCategory;
      }
    } else {
      dispatch(setCategory(hydrated.category));
      window.sessionStorage.setItem(LAST_PROPERTY_CATEGORY_KEY, hydrated.category);
      resolvedCategory = hydrated.category;
    }

    if (hydrated.listingType) {
      dispatch(
        setListingType({
          label:
            hydrated.listingType === "sale"
              ? "Buy"
              : hydrated.listingType === "rent"
                ? "Rent"
                : "Lease",
          value: hydrated.listingType,
        }),
      );
    }

    dispatch(setSearchText(hydrated.searchText));
    dispatch(setBudget({ min: hydrated.minPrice, max: hydrated.maxPrice }));
    dispatch(resetResidentialFilters());
    dispatch(resetCommercialFilters());
    dispatch(resetLandFilters());
    dispatch(resetAgriculturalFilters());

    const activeCategory = resolvedCategory ?? category;

    if (activeCategory === "Residential") {
      Object.entries(hydrated.residential).forEach(([key, value]) => {
        if (value !== undefined) {
          dispatch(
            setResidentialFilter({
              key: key as keyof typeof hydrated.residential,
              value,
            }),
          );
        }
      });
    } else if (activeCategory === "Commercial") {
      Object.entries(hydrated.commercial).forEach(([key, value]) => {
        if (value !== undefined) {
          dispatch(
            setCommercialFilter({
              key: key as keyof typeof hydrated.commercial,
              value,
            }),
          );
        }
      });
    } else if (activeCategory === "Land") {
      Object.entries(hydrated.land).forEach(([key, value]) => {
        if (value !== undefined) {
          dispatch(
            setLandFilter({
              key: key as keyof typeof hydrated.land,
              value,
            }),
          );
        }
      });
    } else if (activeCategory === "Agricultural") {
      Object.entries(hydrated.agricultural).forEach(([key, value]) => {
        if (value !== undefined) {
          dispatch(
            setAgriculturalFilter({
              key: key as keyof typeof hydrated.agricultural,
              value,
            }),
          );
        }
      });
    }

    const city = (searchParams.get("city") ?? "").trim().toLowerCase();
    const state = (searchParams.get("state") ?? "").trim().toLowerCase();
    if (city && locations.length > 0) {
      const matchedCity = locations.find(
        (item) =>
          item.city?.trim().toLowerCase() === city &&
          (!state || item.state?.trim().toLowerCase() === state),
      );

      if (matchedCity?._id) {
        dispatch(setCityId(matchedCity._id));
      }
    }

    setHasRestoredCategory(true);
    setHasHydratedFromUrl(true);
  }, [searchParams, dispatch, locations]);

  useEffect(() => {
    if (!hasHydratedFromUrl) return;
    pendingInitialUrlCategoryRef.current = hydratedUrlCategory ?? null;
  }, [hasHydratedFromUrl, hydratedUrlCategory]);

  useEffect(() => {
    if (!hasRestoredCategory || !hasHydratedFromUrl) return;

    // Protect only the first hydration pass. After the initial URL category
    // has been respected once, user-driven category changes should update URL normally.
    if (pendingInitialUrlCategoryRef.current) {
      if (category !== pendingInitialUrlCategoryRef.current) return;
      pendingInitialUrlCategoryRef.current = null;
    }

    window.sessionStorage.setItem(LAST_PROPERTY_CATEGORY_KEY, category);

    const nextParams = new URLSearchParams();

    Object.entries(urlSearchPayload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      nextParams.set(key, String(value));
    });

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery === currentQuery) return;

    router.replace(`${pathname}?${nextQuery}`, { scroll: false });
  }, [
    category,
    hasRestoredCategory,
    hasHydratedFromUrl,
    pathname,
    router,
    searchParams,
    urlSearchPayload,
  ]);

  useEffect(() => {
    const postedBy = (
      searchParams.get("createdByRole") ||
      searchParams.get("postedBy") ||
      searchParams.get("postedby") ||
      searchParams.get("listingSource") ||
      ""
    )
      .trim()
      .toLowerCase();

    const isOwner = postedBy === "owner" || postedBy === "owners" || postedBy === "user";
    const isAgent = postedBy === "agent" || postedBy === "agents";

    if (!isOwner && !isAgent) {
      return;
    }

    if (category === "Residential") {
      dispatch(
        setResidentialFilter({
          key: "createdByRole",
          value: isAgent ? "agent" : "user",
        }),
      );
      return;
    }

    if (category === "Commercial") {
      dispatch(
        setCommercialFilter({
          key: "createdByRole",
          value: isAgent ? "agent" : "user",
        }),
      );
      return;
    }

    if (category === "Land") {
      dispatch(
        setLandFilter({ key: "createdByRole", value: isAgent ? "agent" : "user" }),
      );
      return;
    }

    if (category === "Agricultural") {
      dispatch(
        setAgriculturalFilter({
          key: "createdByRole",
          value: isAgent ? "agent" : "user",
        }),
      );
    }
  }, [searchParams, category, dispatch]);

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

  // Open search dropdown when coming from SearchBox
  useEffect(() => {
    if (searchParams.get("focus") === "search" && selectedLocalities.length === 0) {
      setSearchOpen(true);
    }
  }, [searchParams, selectedLocalities.length]);

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
      dispatch(
        setLandFilter({
          key: "locality",
          value: toggleArrayValue(selectedLocalities, name),
        }),
      );
    } else {
      dispatch(
        setAgriculturalFilter({
          key: "locality",
          value: toggleArrayValue(selectedLocalities, name),
        }),
      );
    }

    if (!selectedLocalities.includes(name)) {
      dispatch(setSearchText(""));
    }
    setSearchOpen(true);
  };

  const handleRemoveLocality = (name: string) => {
    const next = selectedLocalities.filter((loc) => loc !== name);

    if (category === "Residential") {
      dispatch(setResidentialFilter({ key: "locality", value: next }));
    } else if (category === "Commercial") {
      dispatch(setCommercialFilter({ key: "locality", value: next }));
    } else if (category === "Land") {
      dispatch(setLandFilter({ key: "locality", value: next }));
    } else {
      dispatch(setAgriculturalFilter({ key: "locality", value: next }));
    }
  };

  const localitySuggestions = useMemo(() => {
    const names = Array.from(
      new Map(
        (cityData?.localities ?? [])
          .map((loc) => loc?.name)
          .filter((name): name is string => Boolean(name?.trim()))
          .map((name) => {
            const normalizedName = normalizeLocalityName(name);
            return [getLocalityDedupKey(normalizedName), normalizedName] as const;
          }),
      ).values(),
    );

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
    <div className="sticky top-0 z-45 w-full bg-[#D1EFDD] px-3 shadow-sm">
      <div className="mx-auto flex h-14 items-center gap-4 px-4 container">
        {/* Listing Type + Category + Search */}
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-sm md:w-full md:min-w-0 lg:w-auto lg:min-w-fit">

          <div className="flex items-center gap-2">
            <FilterDropdown
              open={open}
              onOpenChange={setOpen}
              triggerLabel={
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md bg-[#D1EFDD] px-3 py-1.5 text-sm font-medium text-[#15803D] transition-colors hover:bg-[#BDE5CE] cursor-pointer"
                >
                  <span className="leading-none">{listingTypeLabel}</span>

                  <ArrowDropdownIcon
                    size={12}
                    color="#15803D"

                    className={`transition-transform duration-200  ${open ? "rotate-180" : ""
                      }`}
                  />
                </button>


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
                        className="rounded px-2 py-1 hover:bg-gray-100 cursor-pointer"
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
          <FilterDropdown
            open={categoryOpen}
            onOpenChange={setCategoryOpen}
            triggerLabel={
              <button
                type="button"
                className="flex items-center gap-2 bg-transparent text-sm text-gray-900 cursor-pointer"
              >
                <span className="md:max-w-24 md:truncate lg:max-w-none">
                  {getCategoryLabel(category)}
                </span>
                <ArrowDropdownIcon
                  size={12}
                  color="#111827"
                  className={`transition-transform duration-200 ${
                    categoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            }
            width="w-44"
            align="left"
            renderContent={(close) => (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Category</h4>
                <div className="flex flex-col gap-1">
                  {categoryOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        dispatch(setCategory(type));
                        window.sessionStorage.setItem(
                          LAST_PROPERTY_CATEGORY_KEY,
                          type,
                        );
                        close();
                      }}
                      className={`rounded px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                        category === type
                          ? "bg-[#D1EFDD] text-[#15803D] font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {getCategoryLabel(type)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />
          <span className="h-5 w-px bg-gray-200" />
          <div className="hidden md:block md:min-w-0 md:flex-1 lg:flex-none">
            <FilterDropdown
              open={searchOpen}
              onOpenChange={setSearchOpen}
              align="left"
              width="w-[260px] lg:w-[360px]"
              showArrow={false}
              triggerLabel={
                <div className="flex w-full min-w-0 max-w-full items-center cursor-text lg:w-[360px] lg:max-w-[360px]">
                  <IoIosSearch className="mr-2 text-lg text-gray-500" />

                  {selectedLocalities.length > 0 && (
                    <div className="mr-2 flex items-center gap-2 overflow-hidden">
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
                    onChange={(e) => {
                      dispatch(setSearchText(e.target.value));
                      setSearchOpen(true);
                    }}
                    className="bg-transparent text-sm outline-none flex-1 min-w-0"
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
              )}
            />
          </div>
          {/* <span className="h-5 w-px bg-gray-200 lg:hidden" /> */}
          <button
            type="button"
            disabled={
              category !== "Residential" &&
              category !== "Commercial" &&
              category !== "Land" &&
              category !== "Agricultural"
            }
            onClick={() => {
              if (category === "Residential") setShowResidentialAdvanced(true);
              if (category === "Commercial") setShowCommercialAdvanced(true);
              if (category === "Land") setShowLandAdvanced(true);
              if (category === "Agricultural") setShowAgriculturalAdvanced(true);
            }}
            className={`flex items-center gap-2 rounded-md bg-[#D1EFDD] px-3 py-1 text-sm font-medium text-[#15803D] transition-colors hover:bg-[#BDE5CE] lg:hidden ${
              category !== "Residential" &&
              category !== "Commercial" &&
              category !== "Land" &&
              category !== "Agricultural"
                ? "cursor-not-allowed opacity-60"
                : ""
            }`}
          >
            <HiOutlineAdjustmentsHorizontal className="text-base" />
            More 
          </button>


        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <CategoryFilters />
        </div>

      </div>

      <ResidentialMobileFilters
        open={showResidentialAdvanced}
        onClose={() => setShowResidentialAdvanced(false)}
        listingOptions={listingOptions}
        categoryOptions={categoryOptions}
      />

      <CommercialMobileFilter
        open={showCommercialAdvanced}
        onClose={() => setShowCommercialAdvanced(false)}
        listingOptions={listingOptions}
        categoryOptions={categoryOptions}
      />

      <LandMobileFilter
        open={showLandAdvanced}
        onClose={() => setShowLandAdvanced(false)}
        listingOptions={listingOptions}
        categoryOptions={categoryOptions}
      />

      <AgriculturalMobileFilter
        open={showAgriculturalAdvanced}
        onClose={() => setShowAgriculturalAdvanced(false)}
        listingOptions={listingOptions}
        categoryOptions={categoryOptions}
      />
    </div>
  );
};

export default FilterBar;
