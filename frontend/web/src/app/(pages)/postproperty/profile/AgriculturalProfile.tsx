import { useSelector } from "react-redux";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import CounterField from "@/ui/CounterField";
import InputField from "@/ui/InputFiled";
import TextArea from "@/ui/TextArae";
import { useAppDispatch } from "@/Redux/store";
import { submitPropertyThunk } from "@/Redux/thunks/submitPropertyApi";
import InputWithUnit from "@/ui/InputwithUnit";
import Dropdownui from "@/ui/DropDownUI";
import ToggleSwitch from "@/ui/ToggleSwitch";

const AREA_UNITS = [
  "sqft",
  "sqmt",
  "acre",
  "guntha",
  "cent",
  "hectare",
] as const;

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
        <div>
          <p className="text-sm font-semibold text-gray-900">Property Basics</p>
          <p className="text-xs text-gray-500">
            Enter the size, road access, and plantation age of the land
          </p>
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputWithUnit
            label="Total Area"
            value={agricultural.totalArea?.value ?? ""}
            unit={agricultural.totalArea?.unit ?? null}
            units={[
              { label: "SQ.FT", value: "sqft" },
              { label: "SQ.MT", value: "sqmt" },
              { label: "ACRE", value: "acre" },
              { label: "GUNTHA", value: "guntha" },
              { label: "CENT", value: "cent" },
              { label: "HECTARE", value: "hectare" },
            ]}
            placeholder="1200"
            onValueChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "totalArea",
                  value: {
                    value,
                    unit: agricultural.totalArea?.unit || "acre",
                  },
                })
              )
            }
            onUnitChange={(unit) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "totalArea",
                  value: {
                    value: agricultural.totalArea?.value || "",
                    unit,
                  },
                })
              )
            }
          />
          <InputWithUnit
            label="Road Width"
            value={agricultural.roadWidth?.value ?? ""}
            unit={agricultural.roadWidth?.unit ?? null}
            units={[
              { label: "FT", value: "ft" },
              { label: "METER", value: "meter" },
            ]}
            placeholder="40"
            onValueChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "roadWidth",
                  value: {
                    value,
                    unit: agricultural.roadWidth?.unit || "ft",
                  },
                })
              )
            }
            onUnitChange={(unit) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "roadWidth",
                  value: {
                    value: agricultural.roadWidth?.value || "",
                    unit,
                  },
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
        </div>
      </div>

      {/* ========== SOIL & IRRIGATION ========== */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Soil & Irrigation
          </p>
          <p className="text-xs text-gray-500">
            Select soil type, irrigation method, and available water sources
          </p>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Dropdownui
            label="Soil Type"
            value={agricultural.soilType || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "soilType",
                  value,
                })
              )
            }
            options={SOIL_TYPES.map((t) => ({
              value: t,
              label: t.replace("-", " ").toUpperCase(),
            }))}
            placeholder="Select"
          />

          <Dropdownui
            label="Irrigation Type"
            value={agricultural.irrigationType || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "irrigationType",
                  value,
                })
              )
            }
            options={IRRIGATION_TYPES.map((t) => ({
              value: t,
              label: t.replace("-", " ").toUpperCase(),
            }))}
            placeholder="Select"
          />

          <Dropdownui
            label="Water Source"
            value={agricultural.waterSource || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "waterSource",
                  value,
                })
              )
            }
            options={WATER_SOURCES.map((t) => ({
              value: t,
              label: t.replace("-", " ").toUpperCase(),
            }))}
            placeholder="Select"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Borewell Details
          </p>
          <p className="text-xs text-gray-500">
            Provide borewell count, depth, yield, and drilling year
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <>
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
            </>
          )}
        </div>
      </div>

      {/* ========== CROP DETAILS ========== */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">Crop Details</p>
          <p className="text-xs text-gray-500">
            Mention current crops, land usage, and suitable cultivation types
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* ========== LEGAL DOCUMENTS ========== */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Legal & Accessibility
          </p>
          <p className="text-xs text-gray-500">
            Provide information about purchase restrictions and access road type
          </p>
        </div>

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
          <InputField
            label="Access Road Type"
            value={agricultural.accessRoadType || ""}
            placeholder="e.g. Paved, Unpaved"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "accessRoadType",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">Site Features</p>
          <p className="text-xs text-gray-500">
            Specify available infrastructure and on-site facilities
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Boundary Wall */}
          <div
            className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
              agricultural.boundaryWall
                ? "border-green-500 bg-green-50 shadow-sm"
                : "border-gray-300 bg-white hover:border-gray-400"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                agricultural.boundaryWall ? "text-green-800" : "text-gray-700"
              }`}
            >
              Boundary Wall
            </span>

            <ToggleSwitch
              enabled={agricultural.boundaryWall || false}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "boundaryWall",
                    value,
                  })
                )
              }
            />
          </div>

          {/* Electricity Connection */}
          <div
            className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
              agricultural.electricityConnection
                ? "border-green-500 bg-green-50 shadow-sm"
                : "border-gray-300 bg-white hover:border-gray-400"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                agricultural.electricityConnection
                  ? "text-green-800"
                  : "text-gray-700"
              }`}
            >
              Electricity Connection
            </span>

            <ToggleSwitch
              enabled={agricultural.electricityConnection || false}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "electricityConnection",
                    value,
                  })
                )
              }
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 items-end">
            <InputField
              label="Total Price"
              value={agricultural.price || ""}
              placeholder="e.g. 75,00,000"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "price",
                    value: value.replace(/\D/g, ""),
                  })
                )
              }
            />

            <InputField
              label="Price Per Sqft"
              value={agricultural.pricePerSqft || ""}
              placeholder="e.g. 6250"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "pricePerSqft",
                    value: value.replace(/\D/g, ""),
                  })
                )
              }
            />
          </div>

      <div
        className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 ${
          agricultural.isPriceNegotiable
            ? "border-green-500 bg-green-50 shadow-sm"
            : ""
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Is the price negotiable?
          </p>
          <p className="text-xs text-gray-500">
            Enable this if you are open to offers from buyers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium ${
              agricultural.isPriceNegotiable
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            {agricultural.isPriceNegotiable ? "YES" : "NO"}
          </span>
          <ToggleSwitch
            enabled={agricultural.isPriceNegotiable || false}
            onChange={(val) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "isPriceNegotiable",
                  value: val,
                })
              )
            }
          />
        </div>
      </div>

      {/* ========== ADDITIONAL DESCRIPTION ========== */}
      <div className="space-y-4">
        <TextArea
          label="Additional Description"
          value={agricultural.description || ""}
          maxLength={500}
          placeholder="e.g. The land has a gentle slope and is ideal for cultivating a variety of crops. It is well-connected to the main road and has access to electricity and water supply."
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
