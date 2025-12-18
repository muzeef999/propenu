import { useDispatch, useSelector } from "react-redux";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import CounterField from "@/ui/CounterField";
import InputField from "@/ui/InputFiled";
import AmenitiesSelect from "./AmenitiesSelect";
import { AMENITIES } from "../constants/amenities";
import IconCardSelect from "./IconCardSelect";
import { RESIDENTIAL_SUB_TYPES } from "../constants/residentialSubTypes";
import TextArea from "@/ui/TextArae";
import { submitPropertyThunk } from "@/Redux/thunks/submitPropertyApi";
import { useAppDispatch } from "@/Redux/store";

export const FLOORING_TYPES = [
  "vitrified",
  "marble",
  "granite",
  "wooden",
  "ceramic-tiles",
  "mosaic",
  "normal-tiles",
  "cement",
  "other",
] as const;

export const KITCHEN_TYPES = [
  "open",
  "closed",
  "semi-open",
  "island",
  "parallel",
  "u-shaped",
  "l-shaped",
] as const;

const ResidentialProfile = () => {
  const { residential } = useSelector((state: any) => state.postProperty);
  const dispatch = useAppDispatch();

  return (
    <div className="space-y-10">
      {/* ========== PROPERTY BASICS ========== */}
      <div className="space-y-8">
        <InputField
          label="Building / Property Name"
          value={residential.buildingName || ""}
          placeholder="e.g. Green Residency"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "buildingName",
                value,
              })
            )
          }
        />
      </div>

      {/* ========== CONFIGURATION ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">
          Property Configuration
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CounterField
            label="BHK"
            value={residential.bhk || 1}
            min={1}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "bhk",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Bedrooms"
            value={residential.bedrooms || residential.bhk || 1}
            min={1}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "bedrooms",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Bathrooms"
            value={residential.bathrooms || 1}
            min={1}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "bathrooms",
                  value,
                })
              )
            }
          />
          <div>
            <label className="inline-block text-sm font-normal m-0 p-1 bg-gray-400 text-white rounded-t-sm">
              Facing
            </label>

            <select
              value={residential.facing || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "facing",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 text-sm rounded-b-sm rounded-r-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select</option>
              <option value="north">North</option>
              <option value="south">South</option>
              <option value="east">East</option>
              <option value="west">West</option>
              <option value="north-east">North-East</option>
              <option value="north-west">North-West</option>
              <option value="south-east">South-East</option>
              <option value="south-west">South-West</option>
            </select>
          </div>
          <InputField
            label="Parking Type"
            value={residential.buildingName || ""}
            placeholder="e.g. Green Residency"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "buildingName",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Two-Wheeler Parking"
            value={residential.parkingDetails?.twoWheeler || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "parkingDetails",
                  value: {
                    ...residential.parkingDetails,
                    twoWheeler: value,
                  },
                })
              )
            }
          />
          <CounterField
            label="Four-Wheeler Parking"
            value={residential.parkingDetails?.fourWheeler || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "parkingDetails",
                  value: {
                    ...residential.parkingDetails,
                    fourWheeler: value,
                  },
                })
              )
            }
          />
          <InputField
            label="possession Date"
            value={residential.buildingName || ""}
            placeholder="e.g. Green Residency"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "buildingName",
                  value,
                })
              )
            }
          />

          <CounterField
            label="Balconie"
            value={residential.bathrooms || 1}
            min={1}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "bathrooms",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      <div style={{ marginTop: "-6px" }}>
        <AmenitiesSelect
          label="Amenities"
          options={AMENITIES}
          value={residential.amenities || []}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "amenities",
                value,
              })
            )
          }
        />
      </div>

      {/* ========== AREA & LAYOUT ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Area & Layout</p>

        <InputField
          label="Carpet Area (sq ft)"
          type="number"
          value={residential.carpetArea || ""}
          placeholder="e.g. 1200"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "carpetArea",
                value,
              })
            )
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Built-up Area (sq ft)"
            type="number"
            value={residential.builtUpArea || ""}
            placeholder="Optional"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "builtUpArea",
                  value,
                })
              )
            }
          />

          <InputField
            label="Floor Number"
            type="number"
            value={residential.floorNumber || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "floorNumber",
                  value,
                })
              )
            }
          />

          <InputField
            label="Total Floors"
            type="number"
            value={residential.totalFloors || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "totalFloors",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      <IconCardSelect
        label="Property Type"
        value={residential.propertySubType}
        options={RESIDENTIAL_SUB_TYPES}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType: "residential",
              key: "propertySubType",
              value,
            })
          )
        }
      />

      {/* ========== INTERIORS ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Interiors</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Flooring */}
          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Flooring Type
            </label>
            <select
              value={residential.flooringType || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "flooringType",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select</option>
              {FLOORING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Kitchen */}
          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Kitchen Type
            </label>
            <select
              value={residential.kitchenType || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "kitchenType",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select</option>
              {KITCHEN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modular Kitchen */}
        <div className="flex items-center justify-between border px-4 py-2 rounded-md">
          <span className="text-sm text-gray-700">Modular Kitchen</span>
          <input
            type="checkbox"
            checked={residential.isModularKitchen || false}
            onChange={(e) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "isModularKitchen",
                  value: e.target.checked,
                })
              )
            }
            className="w-5 h-5 accent-green-600"
          />
        </div>
      </div>

      {/* ================= Transaction & Furnishing ================= */}
      <div className="space-y-6">
        {/* Section title */}
        <p className="text-sm font-medium text-gray-700">
          Transaction & Furnishing
        </p>

        {/* ===== Construction Status ===== */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">
            Construction Status
          </p>

          <div className="flex flex-wrap gap-3">
            {["ready-to-move", "under-construction"].map((status) => {
              const active = residential.constructionStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "residential",
                        key: "constructionStatus",
                        value: status,
                      })
                    )
                  }
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition
              ${
                active
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }
            `}
                >
                  {status.replace("-", " ").toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== Possession Date (conditional) ===== */}
        {residential.constructionStatus === "under-construction" && (
          <InputField
            label="Expected Possession Date"
            type="date"
            value={residential.possessionDate || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "possessionDate",
                  value,
                })
              )
            }
          />
        )}

        {/* ===== Furnishing ===== */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Furnishing</p>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "Unfurnished", value: "unfurnished" },
              { label: "Semi-Furnished", value: "semi-furnished" },
              { label: "Fully Furnished", value: "fully-furnished" },
            ].map((item) => {
              const active = residential.furnishing === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "residential",
                        key: "furnishing",
                        value: item.value,
                      })
                    )
                  }
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition
              ${
                active
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }
            `}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= Property Condition ================= */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Property Condition</p>

        {/* Property Age */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Property Age</p>

          <div className="flex flex-wrap gap-3">
            {[
              "under-construction",
              "0-1-year",
              "1-5-years",
              "5-10-years",
              "10-20-years",
              "20-plus-years",
            ].map((age) => {
              const active = residential.propertyAge === age;

              return (
                <button
                  key={age}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "residential",
                        key: "propertyAge",
                        value: age,
                      })
                    )
                  }
                  className={`px-4 py-2 rounded-full border text-sm transition
              ${
                active
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }
            `}
                >
                  {age.replace("-", " ").toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Construction Year */}
        <InputField
          label="Construction Year"
          type="number"
          placeholder="e.g. 2019"
          value={residential.constructionYear || ""}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "constructionYear",
                value,
              })
            )
          }
        />

        {/* Possession Date (only when under construction) */}
        {residential.propertyAge === "under-construction" && (
          <InputField
            label="Expected Possession Date"
            type="date"
            value={residential.possessionDate || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "possessionDate",
                  value,
                })
              )
            }
          />
        )}
      </div>

      {/* ================= Kitchen & Interior ================= */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Kitchen & Interior</p>

        {/* Kitchen Type */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Kitchen Type</p>

          <div className="flex flex-wrap gap-3">
            {[
              "open",
              "closed",
              "semi-open",
              "island",
              "parallel",
              "u-shaped",
              "l-shaped",
            ].map((type) => {
              const active = residential.kitchenType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "residential",
                        key: "kitchenType",
                        value: type,
                      })
                    )
                  }
                  className={`px-4 py-2 rounded-full border text-sm transition
              ${
                active
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }
            `}
                >
                  {type.replace("-", " ").toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modular Kitchen */}
        <div className="flex items-center justify-between border px-4 py-2 rounded-md">
          <span className="text-sm text-gray-700">Modular Kitchen</span>
          <input
            type="checkbox"
            checked={residential.isModularKitchen || false}
            onChange={(e) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "isModularKitchen",
                  value: e.target.checked,
                })
              )
            }
            className="w-5 h-5 accent-green-600"
          />
        </div>
      </div>

      {/* ================= Security ================= */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Security</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: "gated", label: "Gated Community" },
            { key: "cctv", label: "CCTV Surveillance" },
            { key: "guard", label: "Security Guard" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between border px-4 py-2 rounded-md"
            >
              <span className="text-sm text-gray-700">{item.label}</span>
              <input
                type="checkbox"
                checked={residential.security?.[item.key] || false}
                onChange={(e) =>
                  dispatch(
                    setProfileField({
                      propertyType: "residential",
                      key: "security",
                      value: {
                        ...residential.security,
                        [item.key]: e.target.checked,
                      },
                    })
                  )
                }
                className="w-5 h-5 accent-green-600"
              />
            </div>
          ))}
        </div>

        {/* Security Details */}
        <TextArea
          label="Additional Security Details"
          value={residential.security?.details || ""}
          placeholder="e.g. 24/7 guard, biometric entry, intercom system"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "security",
                value: {
                  ...residential.security,
                  details: value,
                },
              })
            )
          }
        />
      </div>

      <button
        type="button"
        onClick={() => dispatch(submitPropertyThunk())}
        className="px-6 py-3 bg-green-600 text-white rounded-md cursor-pointer"
      >
        Submit Property
      </button>
    </div>
  );
};

export default ResidentialProfile;
