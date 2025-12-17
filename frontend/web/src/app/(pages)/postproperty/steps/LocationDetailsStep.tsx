import NearbyLocationSearch from "@/components/location/NearbyLocationSearch";
import dynamic from "next/dynamic";
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

import { setBaseField } from "@/Redux/slice/postPropertySlice";
import InputField from "@/ui/InputFiled";
import TextArea from "@/ui/TextArae";
import { useDispatch, useSelector } from "react-redux";
import { validateLocationDetails } from "@/zod/locationDetailsZod";
import { nextStep } from "@/Redux/slice/postPropertySlice";

const LocationDetailsStep = () => {
  const { propertyType, base } = useSelector(
    (state: any) => state.postProperty
  );
  const dispatch = useDispatch();

  const validationResult = validateLocationDetails(base);

  const isFormValid = validationResult.success;

  const fieldErrors = !validationResult.success
    ? validationResult.error.flatten().fieldErrors
    : {};
  return (
    <div className="space-y-4">
      <TextArea
        label="Property address"
        value={base.address || ""}
        placeholder="e.g. Flat 302, Green Residency, Near Whitefield Metro Station."
        maxLength={500}
        onChange={(value) => dispatch(setBaseField({ key: "address", value }))}
        error={fieldErrors?.address?.[0]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="City"
          value={base.city || ""}
          placeholder="Hyderabad"
          onChange={(value) => dispatch(setBaseField({ key: "city", value }))}
          error={fieldErrors?.city?.[0]}
        />

        <InputField
          label="state"
          value={base.state || ""}
          placeholder="telangana"
          onChange={(value) => dispatch(setBaseField({ key: "state", value }))}
          error={fieldErrors?.state?.[0]}
        />

        <InputField
          label="pincode"
          value={base.pincode || ""}
          placeholder="Pincode"
          onChange={(value) =>
            dispatch(setBaseField({ key: "pincode", value }))
          }
          error={fieldErrors?.pincode?.[0]}
        />
      </div>

      <div>
        <OpenStreetPinMap />
        {/* Map helper / error text */}
        {fieldErrors.location ? (
          <p className="text-xs text-red-500">
            Please pin the property location on the map
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Click on the map to mark the exact location of your property.
          </p>
        )}
      </div>

      <div>
        <NearbyLocationSearch />
        {fieldErrors.nearbyPlaces?.[0] && (
          <p className="text-xs text-red-500">{fieldErrors.nearbyPlaces[0]}</p>
        )}
      </div>

      <button
        type="button"
        disabled={!isFormValid}
        onClick={() => dispatch(nextStep())}
        className="px-4 py-2 btn-primary text-white rounded disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
};

export default LocationDetailsStep;
