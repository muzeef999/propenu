"use client";

import NearbyLocationSearch from "@/components/location/NearbyLocationSearch";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/Redux/store";
import { useEffect, useRef, useState } from "react";

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

type PostalPincodeResponse = {
  Status?: string;
  PostOffice?: Array<{
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
      return { city: "", state: "" };
    }

    const data: PostalPincodeResponse[] = await res.json();
    const firstPostalOffice = data?.[0]?.PostOffice?.[0];

    return {
      city: formatToTitleCase(firstPostalOffice?.District || ""),
      state: formatToTitleCase(firstPostalOffice?.State || ""),
    };
  } catch (err) {
    if ((err as { name?: string })?.name !== "AbortError") {
      console.error("Postal pincode lookup error:", err);
    }

    return { city: "", state: "" };
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
  const { propertyType, base, draftId } = useSelector(
    (state: any) => state.postProperty,
  );

  const dispatch = useDispatch<AppDispatch>();
  const [showErrors, setShowErrors] = useState(false);
  const skipNextFieldGeocodeRef = useRef(false);

  useEffect(() => {
    if (skipNextFieldGeocodeRef.current) {
      skipNextFieldGeocodeRef.current = false;
      return;
    }

    if (!base.locality || !base.city || !base.state) return;

    const controller = new AbortController();

    const fetchCoordinates = async () => {
      try {
        const query = `${base.locality}, ${base.city}, ${base.state}`;

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
          return;
        }

        let data;

        try {
          data = await res.json();
        } catch {
          console.warn("Invalid JSON from Nominatim");
          return;
        }

        if (!Array.isArray(data) || data.length === 0) return;

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
    if (pincode.length !== 6) return;

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        const [postalResult, best] = await Promise.all([
          lookupPincodeWithPostalApi(pincode, controller.signal),
          lookupPincodeWithOpenStreet(pincode, controller.signal),
        ]);

        if (!best) {
          console.warn("No pincode result found");
          return;
        }

        const address = best?.address;

        const locality = getLocalityFromAddress(address);

        const city = postalResult.city || getCityFromAddress(address);
        const state =
          postalResult.state || formatToTitleCase(address?.state || "");

        const lat = Number(best?.lat);
        const lon = Number(best?.lon);

        // Preserve coordinates returned by pincode lookup instead of
        // immediately re-geocoding with locality + district + state.
        skipNextFieldGeocodeRef.current = true;

        // Update redux fields.
        if (state) {
          dispatch(setBaseField({ key: "state", value: state }));
        }

        if (city) {
          dispatch(setBaseField({ key: "city", value: city }));
        }

        if (locality) {
          dispatch(setBaseField({ key: "locality", value: locality }));
        }

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
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

  const isLandOrAgri =
    propertyType === "land" || propertyType === "agricultural";
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
        <InputField
          label="Locality"
          value={base.locality || ""}
          placeholder="Enter locality"
          onChange={(value) =>
            dispatch(
              setBaseField({
                key: "locality",
                value: formatToTitleCase(value),
              }),
            )
          }
          error={getError("locality")}
        />

        <InputField
          label="City"
          value={base.city || ""}
          placeholder="Enter city"
          disabled
          onChange={(value) =>
            dispatch(
              setBaseField({
                key: "city",
                value: formatToTitleCase(value),
              }),
            )
          }
          error={getError("city")}
        />

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
              category: propertyType,
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
