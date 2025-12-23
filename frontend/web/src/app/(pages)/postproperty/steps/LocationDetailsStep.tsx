"use client";

import NearbyLocationSearch from "@/components/location/NearbyLocationSearch";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";

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

  const validationResult = validateLocationDetails(base);
  const isFormValid = validationResult.success;

  const fieldErrors =
    showErrors && !validationResult.success
      ? validationResult.error.flatten().fieldErrors
      : {};

  const getCustomError = (key: string, msg: string) => {
    const error = (fieldErrors as any)?.[key]?.[0];
    if (!error) return undefined;
    if (error.includes("expected string") || error === "Required") {
      return msg;
    }
    return error;
  };

  // ✅ Handle pincode lookup safely
  const handlePincodeChange = (value: string) => {
    dispatch(setBaseField({ key: "pincode", value }));

    if (value.length !== 6) return;

    const data = search(value) as PincodeResult[];

    if (!data || data.length === 0) return;

    const pin = data[0];

    dispatch(setBaseField({ key: "state", value: pin.state }));
    dispatch(setBaseField({ key: "city", value: pin.city }));
    dispatch(setBaseField({ key: "locality", value: pin.village }));
  };

  return (
    <div className="space-y-4">
      {/* Address */}
      <TextArea
        label="Property Line"
        value={base.address || ""}
        placeholder="e.g. Flat 302, Green Residency, Near Metro Station"
        maxLength={500}
        onChange={(value) =>
          dispatch(setBaseField({ key: "address", value }))
        }
        error={getCustomError("address", "Enter property address")}
      />

      <div className="grid grid-cols-1 md:grid-cols-[60%_1fr] gap-4 space-y-4">
        <InputField
          label="Appartment / Society"
          value={base.Appartment || ""}
          placeholder="Enter building or Society Name"
          onChange={(value) =>
            dispatch(setBaseField({ key: "Appartment", value }))
          }
          error={getCustomError("Appartment", "Enter Appartment / Society name")}
        />

        <InputField
          label="Pincode"
          value={base.pincode || ""}
          placeholder="e.g. 560001"
          onChange={(value) => handlePincodeChange(value)}
          error={getCustomError("pincode", "Enter valid pincode")}
        />
      </div>

      {/* locality, state, city*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 space-y-4 mt-2">
        <InputField
          label="Locality"
          value={base.locality || ""}
          placeholder="Enter locality"
          onChange={(value) =>
            dispatch(setBaseField({ key: "locality", value }))
          }
          error={getCustomError("locality", "Enter locality")}
        />

        <InputField
          label="City"
          value={base.city || ""}
          placeholder="Enter city"
          onChange={(value) => dispatch(setBaseField({ key: "city", value }))}
          error={getCustomError("city", "Enter city")}
        />
        <InputField
          label="State"
          value={base.state || ""}
          placeholder="Enter state"
          onChange={(value) => dispatch(setBaseField({ key: "state", value }))}
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
      <NearbyLocationSearch />

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
