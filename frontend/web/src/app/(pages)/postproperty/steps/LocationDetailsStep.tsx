import NearbyLocationSearch from "@/components/location/NearbyLocationSearch";
import OpenStreetPinMap from "@/components/location/OpenStreetPinMap";
import { setBaseField } from "@/Redux/slice/postPropertySlice";
import InputField from "@/ui/InputFiled";
import TextArea from "@/ui/TextArae";
import { useDispatch, useSelector } from "react-redux";

const LocationDetailsStep = () => {
  const { propertyType, base } = useSelector(
    (state: any) => state.postProperty
  );
  const dispatch = useDispatch();
  return (
    <div className="space-y-4">
      <TextArea
        label="Property address"
        value={base.address || ""}
        placeholder="e.g. Flat 302, Green Residency, Near Whitefield Metro Station."
        maxLength={500}
        onChange={(value) => dispatch(setBaseField({ key: "address", value }))}
        //   error={fieldErrors?.description?.[0]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="City"
          value={base.city || ""}
          placeholder="Hyderabad"
          onChange={(value) => dispatch(setBaseField({ key: "city", value }))}
        />

        <InputField
          label="state"
          value={base.state || ""}
          placeholder="telangana"
          onChange={(value) => dispatch(setBaseField({ key: "state", value }))}
        />

        <InputField
          label="pincode"
          value={base.pincode || ""}
          placeholder="Pincode"
          onChange={(value) =>
            dispatch(setBaseField({ key: "pincode", value }))
          }
          // error={fieldErrors?.title?.[0]}
        />
      </div>

      <InputField
        label="City"
        value={base.city || ""}
        placeholder="Hyderabad"
        onChange={(value) => dispatch(setBaseField({ key: "city", value }))}
      />

         <OpenStreetPinMap />
        
        <NearbyLocationSearch />
       
    </div>
  );
};

export default LocationDetailsStep;
