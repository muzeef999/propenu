"use client";
import { categoryOption } from "@/types";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/Redux/store";
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
import {
  fetchSearchableLocations,
  selectAllCitiesWithLocalities,
  selectCityWithLocalities,
  setCityId,
} from "@/Redux/slice/citySlice";
import { useRouter } from "next/navigation";
import { ArrowDropdownIcon } from "@/icons/icons";
import { IoIosSearch } from "react-icons/io";
import { IoCloseCircleOutline } from "react-icons/io5";

const url = process.env.NEXT_PUBLIC_API_URL;
const RECENT_SEARCHES_KEY = "propenu_recent_searches";

const listingOptions = [
  { label: "Buy", value: "sale" },
  { label: "Rent", value: "rent" },
] as const;

type SearchSuggestion =
  | {
      kind: "city";
      cityId?: string;
      city: string;
      state: string;
      label: string;
      subLabel: string;
    }
  | {
      kind: "locality";
      cityId?: string;
      city: string;
      state: string;
      locality: string;
      label: string;
      subLabel: string;
    }
  | {
      kind: "project";
      label: string;
      subLabel: string;
      slug: string;
      city: string;
      state: string;
      locality: string;
    };

type RecentSearchItem = SearchSuggestion & {
  savedAt: number;
};

type SearchCityContext = {
  city: string;
  state: string;
};

const SearchBox = () => {
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [typedSuggestions, setTypedSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [activeSearchCity, setActiveSearchCity] = useState<SearchCityContext | null>(null);
  const [isCityChipDismissed, setIsCityChipDismissed] = useState(false);
  const [selectedProject, setSelectedProject] = useState<
    Extract<SearchSuggestion, { kind: "project" }> | null
  >(null);
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
  const allLocations = useAppSelector(selectAllCitiesWithLocalities);
  const effectiveSearchContext = useMemo(() => {
    const city =
      activeSearchCity?.city?.trim() ||
      (!isCityChipDismissed ? cityData?.city?.trim() : "") ||
      "";
    const state =
      activeSearchCity?.state?.trim() ||
      (!isCityChipDismissed ? cityData?.state?.trim() : "") ||
      "";

    const matchedLocation = city
      ? allLocations.find((location) => {
          const sameCity =
            location.city.trim().toLowerCase() === city.toLowerCase();
          const sameState =
            !state ||
            location.state.trim().toLowerCase() === state.toLowerCase();

          return sameCity && sameState;
        })
      : null;

    return {
      city,
      state,
      cityId: matchedLocation?._id,
      localities:
        matchedLocation?.localities
          ?.map((locality) => locality?.name?.trim())
          .filter((name): name is string => Boolean(name)) ?? [],
    };
  }, [
    activeSearchCity?.city,
    activeSearchCity?.state,
    allLocations,
    cityData?.city,
    cityData?.state,
    isCityChipDismissed,
  ]);
  const visibleSearchCity = effectiveSearchContext.city;
  const syncNavbarCity = (city?: string | null, state?: string | null) => {
    const normalizedCity = city?.trim().toLowerCase();
    const normalizedState = state?.trim().toLowerCase();

    if (!normalizedCity) return;

    const matchedLocation = allLocations.find((location) => {
      const sameCity = location.city.trim().toLowerCase() === normalizedCity;
      const sameState =
        !normalizedState ||
        location.state.trim().toLowerCase() === normalizedState;

      return sameCity && sameState;
    });

    if (!matchedLocation?._id) return;

    dispatch(setCityId(matchedLocation._id));

    if (typeof window !== "undefined") {
      window.localStorage.setItem("selectedCityId", matchedLocation._id);
    }
  };

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
  const appDispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    appDispatch(fetchSearchableLocations());
  }, [appDispatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as RecentSearchItem[];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 5));
      }
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  useEffect(() => {
    const query = searchText.trim();
    if (!query) {
      setTypedSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          limit: "8",
        });

        if (effectiveSearchContext.city) {
          params.set("city", effectiveSearchContext.city);
        }

        const response = await fetch(
          `${url}/api/properties/search/suggestions?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        setTypedSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setTypedSuggestions([]);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [effectiveSearchContext.city, searchText]);

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
  const searchPlaceholder =
    selectedLocalities.length > 0 || visibleSearchCity
      ? "Add More"
      : placeholder;

  const buildPropertiesHref = (
    options?: {
      localities?: string[];
      text?: string;
      city?: string | null;
      state?: string | null;
    },
  ) => {
    const {
      localities = selectedLocalities,
      text = searchText,
      city = effectiveSearchContext.city || null,
      state = effectiveSearchContext.state || null,
    } = options ?? {};

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

    if (city) params.set("city", city);
    if (state) params.set("state", state);

    return `/properties?${params.toString()}`;
  };

  const updateLocalityFilter = (localities: string[]) => {
    if (category === "Residential") {
      dispatch(
        setResidentialFilter({
          key: "locality",
          value: localities,
        }),
      );
      return;
    }

    if (category === "Commercial") {
      dispatch(
        setCommercialFilter({
          key: "locality",
          value: localities,
        }),
      );
      return;
    }

    if (category === "Land") {
      dispatch(setLandFilter({ key: "locality", value: localities }));
      return;
    }

    dispatch(setAgriculturalFilter({ key: "locality", value: localities }));
  };

  const handleLocalitySelect = (
    name: string,
    city?: string | null,
    state?: string | null,
  ) => {
    const nextLocalities = toggleArrayValue(selectedLocalities, name);

    updateLocalityFilter(nextLocalities);
    setSelectedProject(null);
    if (city) {
      setIsCityChipDismissed(false);
      setActiveSearchCity({
        city,
        state: state ?? "",
      });
      syncNavbarCity(city, state);
    }
    dispatch(setSearchText(""));
    setSearchOpen(false);
  };

  const saveRecentSearch = (item: SearchSuggestion) => {
    if (typeof window === "undefined") return;

    const nextItem: RecentSearchItem = {
      ...item,
      savedAt: Date.now(),
    };

    setRecentSearches((current) => {
      const deduped = current.filter((existing) => {
        if (existing.kind !== nextItem.kind) return true;

        if (existing.kind === "city" && nextItem.kind === "city") {
          return existing.city.toLowerCase() !== nextItem.city.toLowerCase();
        }

        if (existing.kind === "locality" && nextItem.kind === "locality") {
          return !(
            existing.locality.toLowerCase() === nextItem.locality.toLowerCase() &&
            existing.city.toLowerCase() === nextItem.city.toLowerCase()
          );
        }

        if (existing.kind === "project" && nextItem.kind === "project") {
          return existing.slug !== nextItem.slug;
        }

        return true;
      });

      const updated = [nextItem, ...deduped].slice(0, 5);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!searchText.trim()) {
      return [];
    }

    return typedSuggestions;
  }, [searchText, typedSuggestions]);

  const emptyStateSuggestions = useMemo<SearchSuggestion[]>(() => {
    const prioritizedLocalities = effectiveSearchContext.localities.map(
      (locality) => ({
        kind: "locality" as const,
        cityId: effectiveSearchContext.cityId,
        city: effectiveSearchContext.city,
        state: effectiveSearchContext.state,
        locality,
        label: locality,
        subLabel: effectiveSearchContext.city,
      }),
    );

    if (visibleSearchCity) {
      return prioritizedLocalities.slice(0, 8);
    }

    return allLocations.slice(0, 8).map((location) => ({
      kind: "city" as const,
      cityId: location._id,
      city: location.city,
      state: location.state,
      label: location.city,
      subLabel: location.state,
    }));
  }, [
    allLocations,
    effectiveSearchContext.city,
    effectiveSearchContext.cityId,
    effectiveSearchContext.localities,
    effectiveSearchContext.state,
    visibleSearchCity,
  ]);

  const groupedTypedSuggestions = useMemo(() => {
    return {
      cities: searchSuggestions.filter((suggestion) => suggestion.kind === "city"),
      localities: searchSuggestions.filter(
        (suggestion) => suggestion.kind === "locality",
      ),
      projects: searchSuggestions.filter(
        (suggestion) => suggestion.kind === "project",
      ),
    };
  }, [searchSuggestions]);
  const emptyStateSuggestionsHeading = visibleSearchCity
    ? `Popular In ${visibleSearchCity}`
    : "Popular Cities";

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.kind === "city") {
      saveRecentSearch(suggestion);
      setSelectedProject(null);
      setIsCityChipDismissed(false);
      setActiveSearchCity({
        city: suggestion.city,
        state: suggestion.state,
      });
      syncNavbarCity(suggestion.city, suggestion.state);
      updateLocalityFilter([]);
      dispatch(setSearchText(""));
      setSearchOpen(false);
      return;
    }

    if (suggestion.kind === "project") {
      saveRecentSearch(suggestion);
      dispatch(setSearchText(""));
      setSelectedProject(suggestion);
      setIsCityChipDismissed(false);
      setActiveSearchCity({
        city: suggestion.city,
        state: suggestion.state,
      });
      syncNavbarCity(suggestion.city, suggestion.state);
      setSearchOpen(false);
      return;
    }

    saveRecentSearch(suggestion);
    handleLocalitySelect(
      suggestion.locality,
      suggestion.city,
      suggestion.state,
    );
  };

  const handleSearchSubmit = () => {
    if (selectedProject) {
      router.push(`/project/${selectedProject.slug}`);
      return;
    }

    const firstSuggestion = searchText.trim() ? searchSuggestions[0] : null;

    if (firstSuggestion) {
      if (firstSuggestion.kind === "project") {
        handleSuggestionSelect(firstSuggestion);
        router.push(`/project/${firstSuggestion.slug}`);
        return;
      }

      if (firstSuggestion.kind === "city") {
        handleSuggestionSelect(firstSuggestion);
        router.push(
          buildPropertiesHref({
            localities: [],
            text: "",
            city: firstSuggestion.city,
            state: firstSuggestion.state,
          }),
        );
        return;
      }

      handleSuggestionSelect(firstSuggestion);
      router.push(
        buildPropertiesHref({
          localities: toggleArrayValue(selectedLocalities, firstSuggestion.locality),
          text: "",
          city: firstSuggestion.city,
          state: firstSuggestion.state,
        }),
      );
      return;
    } else {
      const cleanedSearch = searchText.trim();
      if (!cleanedSearch && selectedLocalities.length === 0 && !visibleSearchCity) {
        return;
      }
    }

    router.push(
      buildPropertiesHref({
        text: selectedLocalities.length > 0 ? "" : searchText,
      }),
    );
  };

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
                <div className="flex flex-col">
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
            <div className="flex min-w-0 items-center cursor-text">
              <IoIosSearch className="mr-3 shrink-0 text-lg text-gray-500" />
              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
              {visibleSearchCity && (
                <div className="flex min-w-0 shrink items-center overflow-hidden">
                  <span className="flex min-w-0 max-w-40 items-center gap-2 rounded-full bg-[#f4eaea] px-3 py-1 text-sm font-normal text-gray-800">
                    <span className="truncate">{visibleSearchCity}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSearchCity(null);
                        setIsCityChipDismissed(true);
                        setSelectedProject(null);
                      }}
                      className="shrink-0 text-gray-500 transition-colors hover:text-gray-900"
                    >
                      <IoCloseCircleOutline className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              )}
              {selectedLocalities.length > 0 && (
                <div className="flex min-w-0 shrink items-center gap-2 overflow-hidden">
                  <span className="flex min-w-0 max-w-40 items-center gap-2 rounded-full bg-[#f4eaea] px-3 py-1 text-sm font-normal text-gray-800">
                    <span className="truncate">{selectedLocalities[0]}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLocalityFilter(
                          selectedLocalities.filter((locality) => locality !== selectedLocalities[0]),
                        );
                        setSelectedProject(null);
                      }}
                      className="shrink-0 text-gray-500 transition-colors hover:text-gray-900"
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
                value={searchText}
                onFocus={() => setSearchOpen(true)}
                onClick={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSelectedProject(null);
                  dispatch(setSearchText(e.target.value));
                  setSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full min-w-[120px] flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
              </div>
            </div>

            {searchOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-70 w-[520px] max-w-[min(94vw,520px)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  {searchText.trim()
                    ? "Search cities, localities and projects"
                    : "Search across cities"}
                </p>

                {!searchText.trim() && recentSearches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Recent Searches
                    </p>
                    <div className="flex flex-col gap-2">
                      {recentSearches.map((suggestion, index) => (
                        <button
                          key={`${suggestion.kind}-${index}`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="text-left text-sm cursor-pointer text-gray-800 hover:text-primary"
                        >
                          {suggestion.label},{" "}
                          <span className="text-[#26ad5f]">
                            {suggestion.subLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!searchText.trim() && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {emptyStateSuggestionsHeading}
                  </p>
                )}

                {searchText.trim() && searchSuggestions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No city, locality or project found for &quot;{searchText}&quot;
                  </p>
                )}

                {!searchText.trim() &&
                  visibleSearchCity &&
                  emptyStateSuggestions.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No popular localities found in {visibleSearchCity}
                    </p>
                  )}

                <div className="flex flex-col">
                  {searchText.trim() ? (
                    <>
                      {groupedTypedSuggestions.cities.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Cities
                          </p>
                          <div className="flex flex-col">
                            {groupedTypedSuggestions.cities.map((suggestion) => (
                              <button
                                key={`city-${suggestion.cityId ?? suggestion.city}`}
                                onClick={() => {
                                  handleSuggestionSelect(suggestion);
                                  setSearchOpen(false);
                                }}
                                className="rounded-md text-left py-1 text-sm text-gray-800 transition-colors hover:bg-gray-50 hover:text-primary"
                              >
                                {suggestion.label},{" "}
                                <span className="text-[#26ad5f]">
                                  {suggestion.subLabel}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {groupedTypedSuggestions.localities.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Localities
                          </p>
                          <div className="flex flex-col">
                            {groupedTypedSuggestions.localities.map((suggestion) => (
                              <button
                                key={`locality-${suggestion.cityId ?? suggestion.city}-${suggestion.locality}`}
                                onClick={() => {
                                  handleSuggestionSelect(suggestion);
                                  setSearchOpen(false);
                                }}
                                className="rounded-md text-left py-1 text-sm text-gray-800 transition-colors hover:bg-gray-50 hover:text-primary"
                              >
                                {suggestion.label},{" "}
                                <span className="text-[#26ad5f]">
                                  {suggestion.subLabel}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {groupedTypedSuggestions.projects.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Projects
                          </p>
                          <div className="flex flex-col">
                            {groupedTypedSuggestions.projects.map((suggestion) => (
                              <button
                                key={`project-${suggestion.slug}`}
                                onClick={() => {
                                  handleSuggestionSelect(suggestion);
                                  setSearchOpen(false);
                                }}
                                className="rounded-md text-left py-1 text-sm text-gray-800 transition-colors hover:bg-gray-50 hover:text-primary"
                              >
                                {suggestion.label},{" "}
                                <span className="text-[#26ad5f]">
                                  {suggestion.subLabel}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {emptyStateSuggestions.map((suggestion) => (
                        <button
                          key={
                            suggestion.kind === "city"
                              ? `city-${suggestion.cityId ?? suggestion.city}`
                              : suggestion.kind === "locality"
                                ? `locality-${suggestion.cityId ?? suggestion.city}-${suggestion.locality}`
                                : `project-${suggestion.slug}`
                          }
                          onClick={() => {
                            handleSuggestionSelect(suggestion);
                            setSearchOpen(false);
                          }}
                          className="rounded-md py-1 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 hover:text-primary"
                        >
                          {suggestion.label},{" "}
                          <span className="text-[#26ad5f]">
                            {suggestion.subLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSearchSubmit}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0"
          >
            <IoIosSearch className="h-5 w-5" />
            <span className="hidden sm:inline">Search</span>
          </button>
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
