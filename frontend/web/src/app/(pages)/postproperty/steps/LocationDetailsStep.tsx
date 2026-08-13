  "use client";

  import NearbyLocationSearch from "@/components/location/NearbyLocationSearch";
  import dynamic from "next/dynamic";
  import { useDispatch, useSelector } from "react-redux";
  import type { AppDispatch } from "@/Redux/store";
  import { useEffect, useRef, useState } from "react";
  import { FiCheck, FiChevronDown } from "react-icons/fi";

  import { setBaseField, nextStep } from "@/Redux/slice/postPropertySlice";
  import {
    getLocationFieldError,
    validateLocationDetails,
  } from "@/zod/locationDetailsZod";
  import InputField from "@/ui/InputField";
  import TextArea from "@/ui/TextArae";
  import { City, State } from "country-state-city";

  import { submitLocationThunk } from "@/Redux/thunks/submitPropertyApi";

  const OpenStreetPinMap = dynamic<OpenStreetPinMapProps>(
    () =>
      import("@/components/location/OpenStreetPinMap").then(
        (mod) => mod.default,
      ),
    {
      ssr: false,
      loading: () => (
        <div className="h-52 flex items-center justify-center border rounded">
          Loading map…
        </div>
      ),
    }
  );

  type OpenStreetPinMapProps = {
    coordinates?: [number, number];
    shouldAutoFocus?: boolean;
    onPinChange?: (payload: {
      coordinates: [number, number];
      locality?: string;
      city?: string;
      state?: string;
    }) => void;
  };

  type PhotonFeature = {
    geometry: { coordinates: [number, number] };
    properties: {
      name?: string;
      city?: string;
      state?: string;
      district?: string;
      suburb?: string;
      locality?: string;
      postcode?: string;
      country?: string;
      type?: string;
      osm_type?: string;
    };
  };

  type LocalitySuggestion = {
    label: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };

  type CitySuggestion = {
    label: string;
    state: string;
    stateCode: string;
  };

  type StateSuggestion = {
    label: string;
    isoCode: string;
  };

  type LocalityCache = Record<string, LocalitySuggestion[]>;

  function getProjectBackendCategory(projectPropertyType?: string) {
    if (["apartment", "villa"].includes(projectPropertyType ?? "")) {
      return "residential";
    }

    if (projectPropertyType === "commercial-space") {
      return "commercial";
    }

    if (["open-plot", "commercial-plot"].includes(projectPropertyType ?? "")) {
      return "land";
    }

    return "project";
  }

  const formatToTitleCase = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const normalizePincodeAreaName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    return trimmed.replace(/^ward\s*\d+[a-z]?\s+/i, "").trim();
  };

  const normalizeComparisonValue = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  const matchesSearchPrefix = (label: string, query: string) => {
    const normalizedLabel = normalizeComparisonValue(label);
    const normalizedQuery = normalizeComparisonValue(query);

    if (!normalizedLabel || !normalizedQuery) return false;

    if (normalizedLabel.startsWith(normalizedQuery)) return true;

    const labelSegments = normalizedLabel.split(" ").filter(Boolean);
    const querySegments = normalizedQuery.split(" ").filter(Boolean);

    if (!querySegments.length) return false;

    return querySegments.every((querySegment) =>
      labelSegments.some((labelSegment) => labelSegment.startsWith(querySegment)),
    );
  };

  const getPrimaryLocationSegment = (value: string) =>
    value
      .split(",")[0]
      ?.split("/")[0]
      ?.trim() || "";

  // India bounding box: bbox=lon_min,lat_min,lon_max,lat_max
  const INDIA_BBOX = "68.1766451354,7.96553477623,97.4025614766,35.4940095078";

  const searchLocalitiesWithPhoton = async (
    query: string,
    signal: AbortSignal,
    activeState?: string,
    activeCity?: string,
    searchText?: string,
  ): Promise<LocalitySuggestion[]> => {
    if (!query.trim()) return [];

    try {
      // Append state to query for better Photon relevance (e.g. "Gach, Telangana")
      const fullQuery = [query, activeCity, activeState].filter(Boolean).join(", ");
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(fullQuery)}&lang=en&limit=12&bbox=${INDIA_BBOX}`;
      const res = await fetch(url, { signal });

      if (!res.ok) {
        console.error("Photon locality search failed:", res.status);
        return [];
      }

      const data: { features?: PhotonFeature[] } = await res.json();
      const features = data?.features || [];

      const seen = new Set<string>();
      const suggestions: LocalitySuggestion[] = [];

      for (const feature of features) {
        const p = feature.properties;

        // Only show India results
        if (p.country && p.country !== "India") continue;

        // Raw source name — check all name fields for ward patterns
        const rawSource = p.suburb || p.locality || p.name || "";

        // Ward filter: skip if ANY name field contains "Ward <number>" pattern
        // (covers suburb, locality, and name fields independently)
        const wardPattern = /ward\s*\d+/i;
        if (
          wardPattern.test(rawSource) ||
          wardPattern.test(p.name || "") ||
          wardPattern.test(p.suburb || "") ||
          wardPattern.test(p.locality || "")
        ) continue;

        // Build a human-readable locality label
        const localityName = formatToTitleCase(
          normalizePincodeAreaName(rawSource),
        );

        // Final safety: skip if the normalised label still contains a ward reference
        if (wardPattern.test(localityName)) continue;

        // City from Photon — apply ward filter so "Ward 104 Kondapur" never becomes the city
        const rawCity = formatToTitleCase(normalizePincodeAreaName(p.city || p.district || ""));
        const city = wardPattern.test(rawCity) ? "" : rawCity;

        const state = formatToTitleCase(p.state || "");

        if (!localityName) continue;

        if (searchText && !matchesSearchPrefix(localityName, searchText)) continue;

        if (
          activeCity &&
          city &&
          normalizeComparisonValue(city) !== normalizeComparisonValue(activeCity)
        ) {
          continue;
        }

        // If the user has a state selected, only return results from that state
        if (
          activeState &&
          state &&
          normalizeComparisonValue(state) !== normalizeComparisonValue(activeState)
        ) continue;

        const key = normalizeComparisonValue(`${localityName}|${city}|${state}`);
        if (seen.has(key)) continue;
        seen.add(key);

        suggestions.push({
          label: localityName,
          city,
          state,
          coordinates: feature.geometry.coordinates,
        });
      }

      return suggestions;
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        console.error("Photon locality search error:", err);
      }
      return [];
    }
  };

  const getStateSuggestions = (query: string): StateSuggestion[] => {
    const states = State.getStatesOfCountry("IN");

    return states
      .map((state) => ({
        label: state.name,
        isoCode: state.isoCode,
      }))
      .filter((state) =>
        query.trim() ? matchesSearchPrefix(state.label, query) : true,
      );
  };

  const getCitySuggestions = (
    stateName?: string,
    query?: string,
  ): CitySuggestion[] => {
    if (!stateName) return [];

    const selectedState = State.getStatesOfCountry("IN").find(
      (state) =>
        normalizeComparisonValue(state.name) === normalizeComparisonValue(stateName),
    );

    if (!selectedState) return [];

    return City.getCitiesOfState("IN", selectedState.isoCode)
      .map((city) => ({
        label: city.name,
        state: selectedState.name,
        stateCode: selectedState.isoCode,
      }))
      .filter((city) => (query?.trim() ? matchesSearchPrefix(city.label, query) : true));
  };

  const geocodeLocationWithPhoton = async (
    query: string,
    signal: AbortSignal,
  ): Promise<[number, number] | null> => {
    if (!query.trim()) return null;

    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=en&limit=1&bbox=${INDIA_BBOX}`;
      const res = await fetch(url, { signal });

      if (!res.ok) {
        console.error("Photon geocode failed:", res.status);
        return null;
      }

      const data: { features?: PhotonFeature[] } = await res.json();
      const coordinates = data?.features?.[0]?.geometry?.coordinates;

      return coordinates?.length === 2 ? coordinates : null;
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        console.error("Photon geocode error:", err);
      }

      return null;
    }
  };

  const buildLocalityCacheKey = (city?: string, state?: string) =>
    `${normalizeComparisonValue(city || "")}|${normalizeComparisonValue(state || "")}`;

  const filterLocalitySuggestions = (
    suggestions: LocalitySuggestion[],
    searchText?: string,
  ) => {
    if (!searchText?.trim()) return suggestions;

    return suggestions.filter((suggestion) =>
      matchesSearchPrefix(suggestion.label, searchText),
    );
  };

  const LocationDetailsStep = () => {
    const { propertyType, base, draftId, project } = useSelector(
      (state: any) => state.postProperty,
    );
    const dispatch = useDispatch<AppDispatch>();
    const [showErrors, setShowErrors] = useState(false);
    const skipNextFieldGeocodeRef = useRef(false);

    // Photon locality search state
    const [localitySearchInput, setLocalitySearchInput] = useState("");
    const [photonSuggestions, setPhotonSuggestions] = useState<LocalitySuggestion[]>([]);
    const [isPhotonDropdownOpen, setIsPhotonDropdownOpen] = useState(false);
    const [isPhotonLoading, setIsPhotonLoading] = useState(false);
    const photonDropdownRef = useRef<HTMLDivElement>(null);
    const [localityCache, setLocalityCache] = useState<LocalityCache>({});
    const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
    const [citySearchInput, setCitySearchInput] = useState("");
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [isCityLoading, setIsCityLoading] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const [stateSuggestions, setStateSuggestions] = useState<StateSuggestion[]>([]);
    const [stateSearchInput, setStateSearchInput] = useState("");
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const [isStateLoading, setIsStateLoading] = useState(false);
    const stateDropdownRef = useRef<HTMLDivElement>(null);

    // Close Photon dropdown on outside click
    useEffect(() => {
      if (!isStateDropdownOpen) return;

      const handlePointerDown = (event: MouseEvent) => {
        if (
          stateDropdownRef.current &&
          !stateDropdownRef.current.contains(event.target as Node)
        ) {
          setIsStateDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isStateDropdownOpen]);

    useEffect(() => {
      if (!isPhotonDropdownOpen) return;

      const handlePointerDown = (event: MouseEvent) => {
        if (
          photonDropdownRef.current &&
          !photonDropdownRef.current.contains(event.target as Node)
        ) {
          setIsPhotonDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isPhotonDropdownOpen]);

    useEffect(() => {
      if (!isCityDropdownOpen) return;

      const handlePointerDown = (event: MouseEvent) => {
        if (
          cityDropdownRef.current &&
          !cityDropdownRef.current.contains(event.target as Node)
        ) {
          setIsCityDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [isCityDropdownOpen]);

    // Debounced Photon search — runs in both pincode and no-pincode modes
    useEffect(() => {
      const trimmed = localitySearchInput.trim();
      const lookupQuery = trimmed;
      const localityCacheKey = buildLocalityCacheKey(base.city, base.state);
      const cachedSuggestions = localityCache[localityCacheKey] || [];
      const filteredCachedSuggestions = filterLocalitySuggestions(
        cachedSuggestions,
        trimmed || undefined,
      );

      if (!isPhotonDropdownOpen) {
        setPhotonSuggestions([]);
        return;
      }

      // Search localities only after the user types at least 2 letters,
      // and only when city context exists.
      if (!base.city || trimmed.length < 2 || !lookupQuery) {
        setPhotonSuggestions([]);
        return;
      }

      if (filteredCachedSuggestions.length > 0) {
        setPhotonSuggestions(filteredCachedSuggestions);
      }

      const controller = new AbortController();
      let cancelled = false;

      const timeout = setTimeout(async () => {
        setIsPhotonLoading(true);
        const results = await searchLocalitiesWithPhoton(
          lookupQuery,
          controller.signal,
          base.state || undefined,
          base.city || undefined,
          trimmed || undefined,
        );
        if (!cancelled) {
          const nextCachedSuggestions =
            trimmed.length < 3 && cachedSuggestions.length > 0
              ? cachedSuggestions
              : results;

          if (
            results.length > 0 &&
            base.city &&
            base.state
          ) {
            setLocalityCache((prev) => ({
              ...prev,
              [localityCacheKey]: results,
            }));
          }

          setPhotonSuggestions(
            filterLocalitySuggestions(
              nextCachedSuggestions,
              trimmed || undefined,
            ),
          );
          setIsPhotonLoading(false);
        }
      }, 400);

      return () => {
        cancelled = true;
        controller.abort();
        clearTimeout(timeout);
        setIsPhotonLoading(false);
      };
    }, [
      base.city,
      base.locality,
      base.state,
      localityCache,
      isPhotonDropdownOpen,
      localitySearchInput,
    ]);

    useEffect(() => {
      const query = stateSearchInput.trim();

      if (!isStateDropdownOpen) {
        setStateSuggestions([]);
        return;
      }

      const timeout = setTimeout(() => {
        setIsStateLoading(true);
        setStateSuggestions(getStateSuggestions(query));
        setIsStateLoading(false);
      }, 350);

      return () => {
        clearTimeout(timeout);
        setIsStateLoading(false);
      };
    }, [isStateDropdownOpen, stateSearchInput]);

    useEffect(() => {
      const query = citySearchInput.trim();

      if (!isCityDropdownOpen) {
        setCitySuggestions([]);
        return;
      }

      if (!base.state || (query.length > 0 && query.length < 2)) {
        setCitySuggestions([]);
        return;
      }

      const timeout = setTimeout(() => {
        setIsCityLoading(true);
        setCitySuggestions(getCitySuggestions(base.state, query || undefined));
        setIsCityLoading(false);
      }, 350);

      return () => {
        clearTimeout(timeout);
        setIsCityLoading(false);
      };
    }, [base.state, citySearchInput, isCityDropdownOpen]);

    useEffect(() => {
      if (skipNextFieldGeocodeRef.current) {
        skipNextFieldGeocodeRef.current = false;
        return;
      }

      if (!base.locality) return;

      const controller = new AbortController();

      const fetchCoordinates = async () => {
        const queryCandidates = [
          [base.locality, base.city, base.state].filter(Boolean).join(", "),
          [base.locality, base.state].filter(Boolean).join(", "),
          [base.city, base.state].filter(Boolean).join(", "),
          String(base.locality),
        ].filter(Boolean);

        try {
          for (const query of queryCandidates) {
            const coordinates = await geocodeLocationWithPhoton(
              query,
              controller.signal,
            );

            if (!coordinates) {
              continue;
            }

            dispatch(
              setBaseField({
                key: "location",
                value: {
                  type: "Point",
                  coordinates,
                },
              }),
            );
            return;
          }
        } catch (err) {
          if ((err as any).name !== "AbortError") {
            console.error("Geocoding error", err);
          }
        }
      };

      fetchCoordinates();

      return () => controller.abort();
    }, [base.locality, base.city, base.state, dispatch]);

    const validationResult = validateLocationDetails(base);
    const isFormValid = validationResult.success;

    const fieldErrors =
      showErrors && !validationResult.success
        ? validationResult.error.flatten().fieldErrors
        : {};

    const getError = (key: string) => {
      if (!showErrors) return undefined;
      return getLocationFieldError(fieldErrors, key);
    };

    // Keep only numeric pincode input.
    const handlePincodeChange = (value: string) => {
      const numericValue = value.replace(/\D/g, "").slice(0, 6);
      dispatch(setBaseField({ key: "pincode", value: numericValue }));
    };

    const submitCategory =
      propertyType === "project"
        ? getProjectBackendCategory(project?.propertyType)
        : propertyType;
    const isLandOrAgri =
      submitCategory === "land" || propertyType === "agricultural";
    const shouldAutoFocusMap = /^\d{6}$/.test(
      (base.pincode || "").replace(/\D/g, "")
    );

    const handlePinChange = ({
      coordinates,
      locality,
      city,
      state,
    }: {
      coordinates: [number, number];
      locality?: string;
      city?: string;
      state?: string;
    }) => {
      skipNextFieldGeocodeRef.current = true;

      dispatch(
        setBaseField({
          key: "location",
          value: {
            type: "Point",
            coordinates,
          },
        }),
      );

      if (locality) {
        dispatch(setBaseField({ key: "locality", value: locality }));
      }
      if (city) {
        dispatch(setBaseField({ key: "city", value: city }));
      }
      if (state) {
        dispatch(setBaseField({ key: "state", value: state }));
      }
    };

    const applyCitySelection = (suggestion: CitySuggestion) => {
      dispatch(setBaseField({ key: "city", value: suggestion.label }));

      if (suggestion.state) {
        dispatch(setBaseField({ key: "state", value: suggestion.state }));
      }

      setCitySearchInput("");
      setIsCityDropdownOpen(false);
    };

    const applyStateSelection = (suggestion: StateSuggestion) => {
      dispatch(setBaseField({ key: "state", value: suggestion.label }));
      if (
        base.city &&
        !getCitySuggestions(suggestion.label).some(
          (city) =>
            normalizeComparisonValue(city.label) ===
            normalizeComparisonValue(base.city || ""),
        )
      ) {
        dispatch(setBaseField({ key: "city", value: "" }));
        dispatch(setBaseField({ key: "locality", value: "" }));
      }
      setStateSearchInput("");
      setIsStateDropdownOpen(false);
    };

    return (
      <div className="space-y-4">
        {/* Address */}
        <TextArea
          label="Address"
          value={base.address || ""}
          placeholder="e.g. Flat 302, Green Residency, Near Metro Station"
          maxLength={500}
          onChange={(value) =>
            dispatch(
              setBaseField({
                key: "address",
                value: formatToTitleCase(value),
              }),
            )
          }
          error={getError("address")}
        />

        <div className="grid grid-cols-1 md:grid-cols-[60%_1fr] gap-4">
          <InputField
            label={
              isLandOrAgri ? "Land Name / Layout Name" : "Building Name / Society"
            }
            value={isLandOrAgri ? base.landName || "" : base.buildingName || ""}
            placeholder={
              isLandOrAgri
                ? "E.g. Green Valley Project / Green Valley Layout"
                : "Enter building or society name"
            }
            onChange={(value) =>
              dispatch(
                setBaseField({
                  key: isLandOrAgri ? "landName" : "buildingName",
                  value: formatToTitleCase(value),
                }),
              )
            }
            error={getError(isLandOrAgri ? "landName" : "buildingName")}
          />

          <div ref={stateDropdownRef} className="relative w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              State
            </label>

            <button
              type="button"
              onClick={() => {
                setIsStateDropdownOpen((open) => !open);
                if (!isStateDropdownOpen) {
                  setStateSearchInput("");
                }
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                getError("state") ? "border-red-500" : "border-gray-300"
              } ${isStateDropdownOpen ? "border-green-500" : ""}`}
              aria-haspopup="listbox"
              aria-expanded={isStateDropdownOpen}
            >
              <span
                className={`min-w-0 flex-1 truncate ${
                  base.state ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {base.state || "Select state"}
              </span>
              <FiChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                  isStateDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isStateDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-[1000] mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="relative border-b border-gray-100 p-2">
                  <input
                    autoFocus
                    type="text"
                    value={stateSearchInput}
                    placeholder="Search state..."
                    onChange={(e) => setStateSearchInput(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
                  />
                  {isStateLoading && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg
                        className="h-4 w-4 animate-spin text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    </span>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto py-1" role="listbox">
                  {stateSuggestions.length > 0 ? (
                    stateSuggestions.map((suggestion, idx) => {
                      const isSelected = base.state === suggestion.label;

                      return (
                        <button
                          key={`${suggestion.label}-${idx}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => applyStateSelection(suggestion)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? "bg-green-50 text-green-700"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {suggestion.label}
                          </span>
                          {isSelected && (
                            <FiCheck className="h-4 w-4 shrink-0 text-green-600" />
                          )}
                        </button>
                      );
                    })
                  ) : stateSearchInput.trim().length >= 2 && !isStateLoading ? (
                    <p className="px-3 py-3 text-sm text-gray-400">
                      No state found
                    </p>
                  ) : !isStateLoading ? (
                    <p className="px-3 py-3 text-sm text-gray-400">
                      Type at least 2 letters to search state
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {getError("state") && (
              <p className="mt-1 text-xs text-red-500">{getError("state")}</p>
            )}
          </div>
        </div>

        {/* City / Locality / Pincode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div ref={cityDropdownRef} className="relative w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              City
            </label>

            <button
              type="button"
              onClick={() => {
                setIsCityDropdownOpen((open) => !open);
                if (!isCityDropdownOpen) {
                  setCitySearchInput("");
                }
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                getError("city") ? "border-red-500" : "border-gray-300"
              } ${isCityDropdownOpen ? "border-green-500" : ""}`}
              aria-haspopup="listbox"
              aria-expanded={isCityDropdownOpen}
            >
              <span
                className={`min-w-0 flex-1 truncate ${
                  base.city ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {base.city || "Select city"}
              </span>
              <FiChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                  isCityDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isCityDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-[1000] mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="relative border-b border-gray-100 p-2">
                  <input
                    autoFocus
                    type="text"
                    value={citySearchInput}
                    placeholder="Search city…"
                    onChange={(e) => setCitySearchInput(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
                  />
                  {isCityLoading && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg
                        className="h-4 w-4 animate-spin text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    </span>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto py-1" role="listbox">
                  {citySuggestions.length > 0 ? (
                    citySuggestions.map((suggestion, idx) => {
                      const isSelected = base.city === suggestion.label;

                      return (
                        <button
                          key={`${suggestion.label}-${suggestion.state}-${idx}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => applyCitySelection(suggestion)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? "bg-green-50 text-green-700"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {suggestion.label}
                          </span>
                          {isSelected && (
                            <FiCheck className="h-4 w-4 shrink-0 text-green-600" />
                          )}
                        </button>
                      );
                    })
                  ) : citySearchInput.trim().length >= 2 && !isCityLoading ? (
                    <p className="px-3 py-3 text-sm text-gray-400">
                      No city found
                    </p>
                  ) : !isCityLoading ? (
                    <p className="px-3 py-3 text-sm text-gray-400">
                      {base.state
                        ? "Suggested cities for selected state"
                        : "Select state or type at least 2 letters to search city"}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {getError("city") && (
              <p className="mt-1 text-xs text-red-500">{getError("city")}</p>
            )}
          </div>

          <div ref={photonDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locality
            </label>

            <button
              type="button"
              onClick={() => {
                setIsPhotonDropdownOpen((open) => !open);
                if (!isPhotonDropdownOpen) {
                  setLocalitySearchInput("");
                  setPhotonSuggestions([]);
                }
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                getError("locality") ? "border-red-500" : "border-gray-300"
              } ${isPhotonDropdownOpen ? "border-green-500" : ""}`}
              aria-haspopup="listbox"
              aria-expanded={isPhotonDropdownOpen}
            >
              <span className={`min-w-0 flex-1 truncate ${base.locality ? "text-gray-900" : "text-gray-400"}`}>
                {base.locality || "Search locality..."}
              </span>
              <FiChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                  isPhotonDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isPhotonDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-[1000] mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="relative border-b border-gray-100 p-2">
                  <input
                    autoFocus
                    type="text"
                    value={localitySearchInput}
                    placeholder="Type 3+ letters to search..."
                    onChange={(e) => {
                      setLocalitySearchInput(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
                  />
                  {isPhotonLoading && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg
                        className="h-4 w-4 animate-spin text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    </span>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto py-1" role="listbox">
                  {photonSuggestions.length > 0 ? (
                    photonSuggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion.label}-${idx}`}
                        type="button"
                        role="option"
                        onClick={() => {
                          dispatch(setBaseField({ key: "locality", value: suggestion.label }));
                          if (suggestion.city) {
                            dispatch(setBaseField({ key: "city", value: suggestion.city }));
                          }
                          if (suggestion.state) {
                            dispatch(setBaseField({ key: "state", value: suggestion.state }));
                          }
                          skipNextFieldGeocodeRef.current = true;
                          dispatch(
                            setBaseField({
                              key: "location",
                              value: { type: "Point", coordinates: suggestion.coordinates },
                            }),
                          );
                          setCitySearchInput("");
                          setLocalitySearchInput("");
                          setIsPhotonDropdownOpen(false);
                          setPhotonSuggestions([]);
                        }}
                        className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">{suggestion.label}</span>
                        {suggestion.state && (
                          <span className="text-xs text-gray-500">{suggestion.state}</span>
                        )}
                      </button>
                    ))
                  ) : localitySearchInput.trim().length >= 2 && !isPhotonLoading ? (
                    <p className="px-3 py-3 text-sm text-gray-400">No results found</p>
                  ) : !isPhotonLoading ? (
                    <p className="px-3 py-3 text-sm text-gray-400">
                      {base.city
                        ? "Type at least 2 letters to search localities in this city"
                        : "Select city first"}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {getError("locality") && (
              <p className="mt-1 text-xs text-red-500">{getError("locality")}</p>
            )}
          </div>

          <InputField
            label="PIN Code"
            value={base.pincode || ""}
            placeholder="e.g. 500033"
            onChange={handlePincodeChange}
            error={getError("pincode")}
          />
        </div>

        {/* Map */}
        <div>
          <OpenStreetPinMap
            coordinates={
              base.location?.coordinates?.length === 2
                ? base.location.coordinates
                : undefined
            }
            shouldAutoFocus={shouldAutoFocusMap}
            onPinChange={handlePinChange}
          />

          <p className="text-xs text-gray-500">
            Click on the map to mark the exact location of your property.
          </p>
        </div>

        {/* Nearby locations */}
        <NearbyLocationSearch
          locality={base.locality}
          city={base.city}
          state={base.state}
          coordinates={
            base.location?.coordinates?.length === 2
              ? base.location.coordinates
              : undefined
          }
        />

        {/* Continue */}
        <button
          type="button"
          onClick={() => {
            setShowErrors(true);

            if (!isFormValid || !draftId) return;

            dispatch(
              submitLocationThunk({
                category: submitCategory,
                id: draftId,
                data: base,
              }),
            )
              .unwrap()
              .then(() => {
                dispatch(nextStep());
              })
              .catch((err: unknown) => {
                console.error("Location step failed", err);
              });
          }}
          className="px-4 py-2 btn-primary text-white rounded"
        >
          Continue
        </button>
      </div>
    );
  };

  export default LocationDetailsStep;
