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

type NominatimPincodeResult = {
  lat?: string;
  lon?: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    hamlet?: string;
    village?: string;
    town?: string;
    city?: string;
    city_district?: string;
    county?: string;
    state_district?: string;
    state?: string;
  };
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
  coordinates?: [number, number];
};

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

type PostalPincodeResponse = {
  Status?: string;
  PostOffice?: Array<{
    Name?: string;
    District?: string;
    State?: string;
  }>;
};

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

const getPrimaryLocationSegment = (value: string) =>
  value
    .split(",")[0]
    ?.split("/")[0]
    ?.trim() || "";

const uniqueAreaDetails = (postOffices: PostalPincodeResponse["PostOffice"]) => {
  const seen = new Set<string>();
  const localityDistrictMap: Record<string, string> = {};
  const localities: string[] = [];

  (postOffices || []).forEach((postOffice) => {
    const name = formatToTitleCase(
      normalizePincodeAreaName(postOffice?.Name || ""),
    );
    const district = formatToTitleCase(postOffice?.District || "");
    const key = normalizeComparisonValue(name);

    if (!name) return;

    if (!seen.has(key)) {
      seen.add(key);
      localities.push(name);
    }

    if (district) {
      localityDistrictMap[key] = district;
    }
  });

  return { localities, localityDistrictMap };
};

const getLocalityFromAddress = (address: NominatimPincodeResult["address"]) =>
  formatToTitleCase(
    normalizePincodeAreaName(
      address?.suburb ||
        address?.neighbourhood ||
        address?.hamlet ||
        address?.village ||
        address?.town ||
        address?.city_district ||
        address?.county ||
        "",
    ),
  );

const getCityFromAddress = (address: NominatimPincodeResult["address"]) =>
  formatToTitleCase(
    address?.city ||
      address?.town ||
      address?.village ||
      address?.city_district ||
      address?.state_district ||
      address?.county ||
      "",
  );

// India bounding box: bbox=lon_min,lat_min,lon_max,lat_max
const INDIA_BBOX = "68.1766451354,7.96553477623,97.4025614766,35.4940095078";

const searchLocalitiesWithPhoton = async (
  query: string,
  signal: AbortSignal,
  activeState?: string,
): Promise<LocalitySuggestion[]> => {
  try {
    // Append state to query for better Photon relevance (e.g. "Gach, Telangana")
    const fullQuery = activeState ? `${query}, ${activeState}` : query;
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

const searchCitiesWithPhoton = async (
  query: string,
  signal: AbortSignal,
  activeState?: string,
): Promise<CitySuggestion[]> => {
  if (!query.trim()) return [];

  try {
    const fullQuery = activeState ? `${query}, ${activeState}` : query;
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(fullQuery)}&lang=en&limit=12&bbox=${INDIA_BBOX}`;
    const res = await fetch(url, { signal });

    if (!res.ok) {
      console.error("Photon city search failed:", res.status);
      return [];
    }

    const data: { features?: PhotonFeature[] } = await res.json();
    const features = data?.features || [];
    const seen = new Set<string>();
    const suggestions: CitySuggestion[] = [];

    for (const feature of features) {
      const p = feature.properties;

      if (p.country && p.country !== "India") continue;

      const cityName = formatToTitleCase(
        normalizePincodeAreaName(
          getPrimaryLocationSegment(p.city || p.district || ""),
        ),
      );
      const stateName = formatToTitleCase(p.state || "");

      if (!cityName) continue;

      if (
        activeState &&
        stateName &&
        normalizeComparisonValue(stateName) !==
          normalizeComparisonValue(activeState)
      ) {
        continue;
      }

      const key = normalizeComparisonValue(cityName);
      if (seen.has(key)) continue;
      seen.add(key);

      suggestions.push({
        label: cityName,
        state: stateName,
        coordinates: feature.geometry.coordinates,
      });
    }

    return suggestions;
  } catch (err) {
    if ((err as { name?: string })?.name !== "AbortError") {
      console.error("Photon city search error:", err);
    }
    return [];
  }
};

const lookupPincodeWithPostalApi = async (
  pincode: string,
  signal: AbortSignal,
) => {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal,
    });

    if (!res.ok) {
      console.error("Postal pincode lookup failed:", res.status);
      return { city: "", state: "", localities: [], localityDistrictMap: {} };
    }

    const data: PostalPincodeResponse[] = await res.json();
    const postOffices = data?.[0]?.PostOffice || [];
    const firstPostalOffice = postOffices[0];
    const { localities, localityDistrictMap } = uniqueAreaDetails(postOffices);

    return {
      city: formatToTitleCase(firstPostalOffice?.District || ""),
      state: formatToTitleCase(firstPostalOffice?.State || ""),
      localities,
      localityDistrictMap,
    };
  } catch (err) {
    if ((err as { name?: string })?.name !== "AbortError") {
      console.error("Postal pincode lookup error:", err);
    }

    return { city: "", state: "", localities: [], localityDistrictMap: {} };
  }
};

const lookupPincodeWithOpenStreet = async (
  pincode: string,
  signal: AbortSignal,
) => {
  const urls = [
    `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&addressdetails=1&limit=1&accept-language=en`,
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&accept-language=en&q=${encodeURIComponent(
      `${pincode}, India`,
    )}`,
  ];

  for (const url of urls) {
    const res = await fetch(url, {
      signal,
      headers: {
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      console.error("Pincode lookup failed:", res.status);
      continue;
    }

    const data: NominatimPincodeResult[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
  }

  return null;
};

const LocationDetailsStep = () => {
  const { propertyType, base, draftId, project } = useSelector(
    (state: any) => state.postProperty,
  );
  const dispatch = useDispatch<AppDispatch>();
  const [showErrors, setShowErrors] = useState(false);
  const [pincodeLocalities, setPincodeLocalities] = useState<string[]>([]);
  const [localityDistrictMap, setLocalityDistrictMap] = useState<Record<string, string>>({});
  const [isLocalityDropdownOpen, setIsLocalityDropdownOpen] = useState(false);
  const localityDropdownRef = useRef<HTMLDivElement>(null);
  const skipNextFieldGeocodeRef = useRef(false);

  // Photon locality search state
  const [localitySearchInput, setLocalitySearchInput] = useState("");
  const [photonSuggestions, setPhotonSuggestions] = useState<LocalitySuggestion[]>([]);
  const [isPhotonDropdownOpen, setIsPhotonDropdownOpen] = useState(false);
  const [isPhotonLoading, setIsPhotonLoading] = useState(false);
  const photonDropdownRef = useRef<HTMLDivElement>(null);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [citySearchInput, setCitySearchInput] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Filter text for pincode-localities dropdown search
  const [pincodeLocalityFilter, setPincodeLocalityFilter] = useState("");

  useEffect(() => {
    if (!isLocalityDropdownOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        localityDropdownRef.current &&
        !localityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocalityDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isLocalityDropdownOpen]);

  // Close Photon dropdown on outside click
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
    // In pincode mode use pincodeLocalityFilter; in Photon-only mode use localitySearchInput
    const activeInput = pincodeLocalities.length > 0 ? pincodeLocalityFilter : localitySearchInput;
    const trimmed = activeInput.trim();

    // Clear suggestions when query too short
    if (trimmed.length < 3) {
      setPhotonSuggestions([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const timeout = setTimeout(async () => {
      setIsPhotonLoading(true);
      const results = await searchLocalitiesWithPhoton(trimmed, controller.signal, base.state || undefined);
      if (!cancelled) {
        setPhotonSuggestions(results);
        setIsPhotonLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
      setIsPhotonLoading(false);
    };
  }, [localitySearchInput, pincodeLocalityFilter, pincodeLocalities.length, base.state]);

  useEffect(() => {
    const query = citySearchInput.trim();

    if (!isCityDropdownOpen) {
      setCitySuggestions([]);
      return;
    }

    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const timeout = setTimeout(async () => {
      setIsCityLoading(true);
      const results = await searchCitiesWithPhoton(
        query,
        controller.signal,
        base.state || undefined,
      );

      if (!cancelled) {
        setCitySuggestions(results);
        setIsCityLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
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
        [base.locality, base.state].filter(Boolean).join(", "),
        [base.locality, base.city, base.state].filter(Boolean).join(", "),
        String(base.locality),
      ].filter(Boolean);

      try {
        for (const query of queryCandidates) {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query,
            )}&limit=1`,
            {
              signal: controller.signal,
              headers: {
                "Accept-Language": "en",
              },
            },
          );

          if (!res.ok) {
            console.error("Geocoding failed:", res.status);
            continue;
          }

          let data;

          try {
            data = await res.json();
          } catch {
            console.warn("Invalid JSON from Nominatim");
            continue;
          }

          if (!Array.isArray(data) || data.length === 0) {
            continue;
          }

          const { lat, lon } = data[0];

          dispatch(
            setBaseField({
              key: "location",
              value: {
                type: "Point",
                coordinates: [Number(lon), Number(lat)],
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

  useEffect(() => {
    const pincode = (base.pincode || "").replace(/\D/g, "");

    // only run when 6 digit pincode entered
    if (pincode.length !== 6) {
      setPincodeLocalities([]);
      setLocalityDistrictMap({});
      setIsLocalityDropdownOpen(false);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        const [postalResult, best] = await Promise.all([
          lookupPincodeWithPostalApi(pincode, controller.signal),
          lookupPincodeWithOpenStreet(pincode, controller.signal),
        ]);

        setPincodeLocalities(postalResult.localities);
        setLocalityDistrictMap(postalResult.localityDistrictMap || {});

        if (!best && !postalResult.city && !postalResult.state) {
          console.warn("No pincode result found");
          return;
        }

        const address = best?.address;
        const localityFromMap = getLocalityFromAddress(address);
        const selectedLocality =
          postalResult.localities.find(
            (locality) =>
              normalizeComparisonValue(locality) ===
              normalizeComparisonValue(base.locality || ""),
          ) ||
          postalResult.localities[0] ||
          localityFromMap;

        const selectedDistrict =
          selectedLocality &&
          postalResult.localityDistrictMap[normalizeComparisonValue(selectedLocality)];

        const city =
          selectedDistrict ||
          postalResult.city ||
          getCityFromAddress(address);
        const state =
          postalResult.state || formatToTitleCase(address?.state || "");

        const lat = Number(best?.lat || NaN);
        const lon = Number(best?.lon || NaN);
        const hasPincodeCoordinates = Number.isFinite(lat) && Number.isFinite(lon);

        // Preserve coordinates returned by pincode lookup instead of
        // immediately re-geocoding with locality + district + state.
        skipNextFieldGeocodeRef.current = hasPincodeCoordinates;

        // Update redux fields.
        if (state) {
          dispatch(setBaseField({ key: "state", value: state }));
        }

        if (city) {
          dispatch(setBaseField({ key: "city", value: city }));
        }

        if (selectedLocality) {
          dispatch(setBaseField({ key: "locality", value: selectedLocality }));
        }

        if (hasPincodeCoordinates) {
          dispatch(
            setBaseField({
              key: "location",
              value: {
                type: "Point",
                coordinates: [lon, lat],
              },
            }),
          );
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;

        console.error("Pincode lookup error:", err);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [base.pincode, dispatch]);

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

        <InputField
          label="PIN Code"
          value={base.pincode || ""}
          placeholder="e.g. 500033"
          onChange={handlePincodeChange}
          error={getError("pincode")}
        />
      </div>

      {/* Locality / City / State */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div className="w-full">
          {pincodeLocalities.length > 0 ? (
            <div ref={localityDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locality
              </label>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => {
                  const next = !isLocalityDropdownOpen;
                  setIsLocalityDropdownOpen(next);
                  if (next) setPincodeLocalityFilter(""); // reset filter on open
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  getError("locality") ? "border-red-500" : "border-gray-300"
                } ${isLocalityDropdownOpen ? "border-green-500" : ""}`}
                aria-haspopup="listbox"
                aria-expanded={isLocalityDropdownOpen}
              >
                <span className={`min-w-0 flex-1 truncate ${base.locality ? "text-gray-900" : "text-gray-400"}`}>
                  {base.locality || "Select locality"}
                </span>
                <FiChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                    isLocalityDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isLocalityDropdownOpen && (() => {
                const filtered = pincodeLocalities.filter((loc) =>
                  loc.toLowerCase().includes(pincodeLocalityFilter.toLowerCase()),
                );
                return (
                  <div className="absolute left-0 right-0 top-full z-[1000] mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
                    {/* Search input inside the panel */}
                    <div className="relative border-b border-gray-100 p-2">
                      <input
                        autoFocus
                        type="text"
                        value={pincodeLocalityFilter}
                        placeholder="Search locality…"
                        onChange={(e) => {
                          setPincodeLocalityFilter(e.target.value);
                          setPhotonSuggestions([]);
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
                      />
                      {isPhotonLoading && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2">
                          <svg className="h-4 w-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* Pincode localities list */}
                    <div className="max-h-44 overflow-y-auto py-1" role="listbox">
                      {filtered.length > 0 ? (
                        filtered.map((locality) => {
                          const isSelected = base.locality === locality;
                          return (
                            <button
                              key={locality}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                dispatch(setBaseField({ key: "locality", value: locality }));
                                const matchedDistrict = localityDistrictMap[normalizeComparisonValue(locality)];
                                if (matchedDistrict) {
                                  dispatch(setBaseField({ key: "city", value: matchedDistrict }));
                                }
                                setCitySearchInput("");
                                setIsLocalityDropdownOpen(false);
                                setPincodeLocalityFilter("");
                                setPhotonSuggestions([]);
                              }}
                              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                                isSelected
                                  ? "bg-green-50 text-green-700"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              <span className="min-w-0 flex-1 truncate">{locality}</span>
                              {isSelected && <FiCheck className="h-4 w-4 shrink-0 text-green-600" />}
                            </button>
                          );
                        })
                      ) : pincodeLocalityFilter.trim().length < 3 ? (
                        <p className="px-3 py-2 text-sm text-gray-400">No matching locality</p>
                      ) : null}
                    </div>

                    {/* Photon "More localities" section */}
                    {pincodeLocalityFilter.trim().length >= 3 && (
                      <>
                        <div className="border-t border-gray-100 px-3 py-1.5">
                          <span className="text-[11px] font-medium text-gray-500">More localities</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto py-1">
                          {photonSuggestions.length > 0 ? (
                            photonSuggestions.map((suggestion, idx) => (
                              <button
                                key={`photon-${suggestion.label}-${idx}`}
                                type="button"
                                onClick={() => {
                                  dispatch(setBaseField({ key: "locality", value: suggestion.label }));
                                  if (suggestion.city) {
                                    dispatch(setBaseField({ key: "city", value: suggestion.city }));
                                  }
                                  if (suggestion.state) {
                                    dispatch(setBaseField({ key: "state", value: suggestion.state }));
                                  }
                                  const [lon, lat] = suggestion.coordinates;
                                  skipNextFieldGeocodeRef.current = true;
                                  dispatch(setBaseField({ key: "location", value: { type: "Point", coordinates: [lon, lat] } }));
                                  setCitySearchInput("");
                                  setIsLocalityDropdownOpen(false);
                                  setPincodeLocalityFilter("");
                                  setPhotonSuggestions([]);
                                }}
                                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-gray-50"
                              >
                                <span className="font-medium text-gray-900">{suggestion.label}</span>
                                {suggestion.state && <span className="text-xs text-gray-500">{suggestion.state}</span>}
                              </button>
                            ))
                          ) : isPhotonLoading ? null : (
                            <p className="px-3 py-2 text-sm text-gray-400">No other results found</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {getError("locality") && (
                <p className="mt-1 text-xs text-red-500">{getError("locality")}</p>
              )}
            </div>
          ) : (
            // Photon locality search — combobox style (search input lives inside the dropdown)
            <div ref={photonDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locality
              </label>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => {
                  setIsPhotonDropdownOpen((open) => !open);
                  // reset search when opening
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
                  {base.locality || "Search locality…"}
                </span>
                <FiChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                    isPhotonDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown panel with embedded search */}
              {isPhotonDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-[1000] mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
                  {/* Search input inside the panel */}
                  <div className="relative border-b border-gray-100 p-2">
                    <input
                      autoFocus
                      type="text"
                      value={localitySearchInput}
                      placeholder="Type 3+ letters to search…"
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

                  {/* Results list */}
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
                            const [lon, lat] = suggestion.coordinates;
                            skipNextFieldGeocodeRef.current = true;
                            dispatch(setBaseField({ key: "location", value: { type: "Point", coordinates: [lon, lat] } }));
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
                    ) : localitySearchInput.trim().length >= 3 && !isPhotonLoading ? (
                      <p className="px-3 py-3 text-sm text-gray-400">No results found</p>
                    ) : localitySearchInput.trim().length < 3 ? (
                      <p className="px-3 py-3 text-sm text-gray-400">Type at least 3 letters to search</p>
                    ) : null}
                  </div>

                  <div className="border-t border-gray-100 px-3 py-1.5">
                    <span className="text-[10px] text-gray-400">Powered by Photon / OpenStreetMap</span>
                  </div>
                </div>
              )}

              {getError("locality") && (
                <p className="mt-1 text-xs text-red-500">{getError("locality")}</p>
              )}
            </div>
          )}
        </div>

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
                      ? "Type at least 2 letters to search city"
                      : "Select state first"}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {getError("city") && (
            <p className="mt-1 text-xs text-red-500">{getError("city")}</p>
          )}
        </div>

        <InputField
          label="State"
          value={base.state || ""}
          placeholder="Enter state"
          onChange={(value) =>
            dispatch(
              setBaseField({
                key: "state",
                value: formatToTitleCase(value),
              }),
            )
          }
          error={getError("state")}
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
