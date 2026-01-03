"use client";

import NearbyLocationSearch from "@/components/location/NearbyLocationSearch";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { setBaseField, nextStep } from "@/Redux/slice/postPropertySlice";
import { validateLocationDetails } from "@/zod/locationDetailsZod";
import InputField from "@/ui/InputFiled";
import TextArea from "@/ui/TextArae";

import { search } from "india-pincode-search";

const OpenStreetPinMap = dynamic(
  () => import("@/components/location/OpenStreetPinMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 flex items-center justify-center border rounded">
        Loading map…
      </div>
    ),
  }
);

type PincodeResult = {
  city: string;
  district: string;
  office: string;
  pincode: string;
  state: string;
  village: string;
};

const LocationDetailsStep = () => {
  const { propertyType, base } = useSelector(
    (state: any) => state.postProperty
  );

  const dispatch = useDispatch();
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
if (!base.locality || !base.city || !base.state) return;

const controller = new AbortController();

const fetchCoordinates = async () => {
  try {
    const query = `${base.locality}, ${base.city}, ${base.state}`;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    const data = await res.json();
    if (!data || data.length === 0) return;

    const { lat, lon } = data[0];

    dispatch(
      setBaseField({
        key: "location",
        value: {
          type: "Point",
          coordinates: [Number(lon), Number(lat)],
        },
      })
    );
  } catch (err) {
    if ((err as any).name !== "AbortError") {
      console.error("Geocoding error", err);
    }
  }
};

fetchCoordinates();

return () => controller.abort();
}, [base.locality, base.city, base.state]);

  const validationResult = validateLocationDetails(base);
  const isFormValid = validationResult.success;

  const fieldErrors =
    showErrors && !validationResult.success
      ? validationResult.error.flatten().fieldErrors
      : {};

  // ✅ Convert CAPS / lowercase → Title Case
  const formatToTitleCase = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getCustomError = (key: string, msg: string) => {
    const error = (fieldErrors as any)?.[key]?.[0];
    if (!error) return undefined;
    if (error.includes("expected string") || error === "Required") {
      return msg;
    }
    return error;
  };

  // ✅ FIXED PINCODE HANDLER (NO CAPS)
  const handlePincodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    dispatch(setBaseField({ key: "pincode", value: numericValue }));

    if (numericValue.length !== 6) return;

    const data = search(numericValue) as PincodeResult[];
    if (!data || data.length === 0) return;

    const pin = data[0];

    dispatch(
      setBaseField({
        key: "state",
        value: formatToTitleCase(pin.state),
      })
    );

    dispatch(
      setBaseField({
        key: "city",
        value: formatToTitleCase(pin.city),
      })
    );

    dispatch(
      setBaseField({
        key: "locality",
        value: formatToTitleCase(pin.village || pin.office),
      })
    );
  };

  const isLandOrAgri =
    propertyType === "land" || propertyType === "agricultural";

  return (
    <div className="space-y-4">
      {/* Address */}
      <TextArea
        label="Property Line"
        value={base.address || ""}
        placeholder="e.g. Flat 302, Green Residency, Near Metro Station"
        maxLength={500}
        onChange={(value) =>
          dispatch(
            setBaseField({
              key: "address",
              value: formatToTitleCase(value),
            })
          )
        }
        error={getCustomError("address", "Enter property address")}
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
              })
            )
          }
          error={getCustomError(
            isLandOrAgri ? "landName" : "buildingName",
            isLandOrAgri
              ? "Enter Project / Layout name"
              : "Enter Building / Society name"
          )}
        />

        <InputField
          label="Pincode"
          value={base.pincode || ""}
          placeholder="e.g. 500033"
          onChange={handlePincodeChange}
          error={getCustomError("pincode", "Enter valid pincode")}
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
              })
            )
          }
          error={getCustomError("locality", "Enter locality")}
        />

        <InputField
          label="City"
          value={base.city || ""}
          placeholder="Enter city"
          onChange={(value) =>
            dispatch(
              setBaseField({
                key: "city",
                value: formatToTitleCase(value),
              })
            )
          }
          error={getCustomError("city", "Enter city")}
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
              })
            )
          }
          error={getCustomError("state", "Enter state")}
        />
      </div>

      {/* Map */}
      <div>
        <OpenStreetPinMap />
        <p className="text-xs text-gray-500">
          Click on the map to mark the exact location of your property.
        </p>
      </div>

      {/* Nearby locations */}
      <NearbyLocationSearch city={base.city} state={base.state} />

      {/* Continue */}
      <button
        type="button"
        onClick={() => {
          setShowErrors(true);
          if (isFormValid) {
            console.log("LocationDetailsStep Data:", {
              base,
              propertyType,
            });
            dispatch(nextStep());
          }
        }}
        className="px-4 py-2 btn-primary text-white rounded"
      >
        Continue
      </button>
    </div>
  );
};

export default LocationDetailsStep;
