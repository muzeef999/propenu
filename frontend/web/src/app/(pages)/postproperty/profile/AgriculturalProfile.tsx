import { useSelector } from "react-redux";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import CounterField from "@/ui/CounterField";
import InputField from "@/ui/InputFiled";
import TextArea from "@/ui/TextArae";
import { useAppDispatch } from "@/Redux/store";
import { submitPropertyThunk } from "@/Redux/thunks/submitPropertyApi";

const AREA_UNITS = ["sqft", "sqmt", "acre", "guntha", "cent", "hectare"] as const;

const ROAD_WIDTH_UNITS = ["ft", "meter"] as const;

const PROPERTY_TYPES = [
  "agricultural-land",
  "farm-land",
  "orchard-land",
  "plantation",
  "wet-land",
  "dry-land",
  "ranch",
  "dairy-farm",
] as const;

const PROPERTY_SUB_TYPES = [
  "irrigated",
  "non-irrigated",
  "fenced",
  "unfenced",
  "with-well",
  "with-borewell",
  "with-electricity",
  "near-road",
  "inside-village",
  "farmhouse-permission",
] as const;

const SOIL_TYPES = [
  "clay",
  "sandy",
  "loamy",
  "red-soil",
  "black-soil",
  "alluvial",
] as const;

const IRRIGATION_TYPES = [
  "canal",
  "bore-well",
  "tube-well",
  "open-well",
  "sprinkler",
  "drip",
  "rain-fed",
] as const;

const WATER_SOURCES = [
  "bore-well",
  "open-well",
  "tube-well",
  "canal",
  "river",
  "tank",
  "pond",
] as const;

const ACCESS_ROAD_TYPES = [
  "paved",
  "unpaved",
  "gravel",
  "concrete",
  "earthen",
] as const;

const AgriculturalProfile = () => {
  const { agricultural } = useSelector((state: any) => state.postProperty);
  const dispatch = useAppDispatch();

  return (
    <div className="space-y-10">
      {/* ========== PROPERTY BASICS ========== */}
      <div className="space-y-8">
        <InputField
          label="Property / Farm Name"
          value={agricultural.title || ""}
          placeholder="e.g. Green Valley Farm"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "agricultural",
                key: "title",
                value,
              })
            )
          }
        />
      </div>

      {/* ========== LAND DETAILS ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Agriculture Land Details</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Total Area"
            type="number"
            value={agricultural.totalArea?.value || ""}
            placeholder="e.g. 5.5"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "totalArea",
                  value: {
                    value: Number(value) || 0,
                    unit: agricultural.totalArea?.unit,
                  },
                })
              )
            }
          />

          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Area Unit
            </label>
            <select
              value={agricultural.totalArea?.unit || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "totalArea",
                    value: {
                      value: agricultural.totalArea?.value || 0,
                      unit: e.target.value,
                    },
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select unit</option>
              {AREA_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Road Width"
            type="number"
            value={agricultural.roadWidth?.value || ""}
            placeholder="e.g. 40"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "roadWidth",
                  value: {
                    value: Number(value) || 0,
                    unit: agricultural.roadWidth?.unit || "ft",
                  },
                })
              )
            }
          />

          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Road Width Unit
            </label>
            <select
              value={agricultural.roadWidth?.unit || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "roadWidth",
                    value: {
                      value: agricultural.roadWidth?.value || 0,
                      unit: e.target.value,
                    },
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select unit</option>
              <option value="ft">FT</option>
              <option value="meter">METER</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========== SOIL & IRRIGATION ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Soil & Irrigation</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Soil Type
            </label>
            <select
              value={agricultural.soilType || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "soilType",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select</option>
              {SOIL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Irrigation Type
            </label>
            <select
              value={agricultural.irrigationType || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "irrigationType",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select</option>
              {IRRIGATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Water Source
            </label>
            <select
              value={agricultural.waterSource || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "waterSource",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select</option>
              {WATER_SOURCES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Access Road Type
            </label>
            <select
              value={agricultural.accessRoadType || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "accessRoadType",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select</option>
              {ACCESS_ROAD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agricultural.boundaryWall || false}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "boundaryWall",
                    value: e.target.checked,
                  })
                )
              }
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-sm text-gray-700">Boundary Wall</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agricultural.electricityConnection || false}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "electricityConnection",
                    value: e.target.checked,
                  })
                )
              }
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-sm text-gray-700">Electricity Connection</span>
          </div>
        </div>
      </div>

      {/* ========== CROP DETAILS ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Crop Details</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Current Crop"
            value={agricultural.currentCrop || ""}
            placeholder="e.g. Sugarcane"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "currentCrop",
                  value,
                })
              )
            }
          />

          <InputField
            label="Suitable For"
            value={agricultural.suitableFor || ""}
            placeholder="e.g. Cotton, Wheat"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "suitableFor",
                  value,
                })
              )
            }
          />

          <CounterField
            label="Plantation Age (years)"
            value={agricultural.plantationAge || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "plantationAge",
                  value,
                })
              )
            }
          />

          <InputField
            label="Land Shape"
            value={agricultural.landShape || ""}
            placeholder="e.g. Square, Rectangular"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "landShape",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      {/* ========== BOREWELL DETAILS ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Borewell Details</p>

        <CounterField
          label="Number of Borewells"
          value={agricultural.numberOfBorewells || 0}
          min={0}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "agricultural",
                key: "numberOfBorewells",
                value,
              })
            )
          }
        />

        {agricultural.numberOfBorewells > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Borewell Depth (meters)"
              type="number"
              value={agricultural.borewellDetails?.depthMeters || ""}
              placeholder="e.g. 100"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "borewellDetails",
                    value: {
                      ...agricultural.borewellDetails,
                      depthMeters: Number(value) || 0,
                    },
                  })
                )
              }
            />

            <InputField
              label="Yield (LPM)"
              type="number"
              value={agricultural.borewellDetails?.yieldLpm || ""}
              placeholder="e.g. 5000"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "borewellDetails",
                    value: {
                      ...agricultural.borewellDetails,
                      yieldLpm: Number(value) || 0,
                    },
                  })
                )
              }
            />

            <InputField
              label="Drilled Year"
              type="number"
              value={agricultural.borewellDetails?.drilledYear || ""}
              placeholder="e.g. 2020"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "borewellDetails",
                    value: {
                      ...agricultural.borewellDetails,
                      drilledYear: Number(value) || 0,
                    },
                  })
                )
              }
            />
          </div>
        )}
      </div>

      {/* ========== LEGAL DOCUMENTS ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Legal Documents</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="State Purchase Restrictions"
            value={agricultural.statePurchaseRestrictions || ""}
            placeholder="e.g. None, Restricted"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "statePurchaseRestrictions",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      {/* ========== PROPERTY TYPE ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Property Type</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Property Type
            </label>
            <select
              value={agricultural.propertyType || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "propertyType",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select property type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Property Sub Type
            </label>
            <select
              value={agricultural.propertySubType || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "propertySubType",
                    value: e.target.value,
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select sub type</option>
              {PROPERTY_SUB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========== ADDITIONAL DESCRIPTION ========== */}
      <div className="space-y-4">
        <TextArea
          label="Additional Description"
          value={agricultural.description || ""}
          maxLength={500}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "agricultural",
                key: "description",
                value,
              })
            )
          }
        />
      </div>

      {/* ========== SUBMIT BUTTON ========== */}
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

export default AgriculturalProfile;