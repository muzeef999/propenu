import { useDispatch, useSelector } from "react-redux";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import CounterField from "@/ui/CounterField";
import InputField from "@/ui/InputFiled";
import AmenitiesSelect from "./AmenitiesSelect";
import { AMENITIES } from "../constants/amenities";
import IconCardSelect from "./IconCardSelect";
import { COMMERCIAL_PROPERTY_OPTIONS } from "../constants/subTypes";
import TextArea from "@/ui/TextArae";
import { submitPropertyThunk } from "@/Redux/thunks/submitPropertyApi";
import { useAppDispatch } from "@/Redux/store";

export const TRANSACTION_TYPES = [
  "new-sale",
  "resale",
  "pre-leased",
  "rent",
  "lease",
] as const;

export const CONSTRUCTION_STATUS = [
  "ready-to-move",
  "under-construction",
  "new-lanch",
] as const;

export const FURNISHED_STATUS = [
  "unfurnished",
  "semi-furnished",
  "fully-furnished",
] as const;

export const PANTRY_TYPES = [
"none",
  "dry",
  "wet",
  "shared",
  "cafeteria-access",] as const;

const CommercialProfile = () => {
  const { commercial } = useSelector((state: any) => state.postProperty);
  const dispatch = useAppDispatch();

  return (
    <div className="space-y-10">
      {/* ========== PROPERTY BASICS ========== */}
      <div className="space-y-8">
        <InputField
          label="Building / Property Name"
          value={commercial.buildingName || ""}
          placeholder="e.g. Green Residency"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "buildingName",
                value,
              })
            )
          }
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Transaction Type
          </label>
          <select
            value={commercial.transactionType || ""}
            onChange={(e) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "transactionType",
                  value: e.target.value,
                })
              )
            }
            className="w-full border px-3 py-2 text-sm rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Transaction Type</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("-", " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========== CONFIGURATION ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">
          Property Configuration
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CounterField
            label="Washrooms"
            value={commercial.washrooms || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "washrooms",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Office Rooms"
            value={commercial.officeRooms || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "officeRooms",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Cabins"
            value={commercial.cabins || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "cabins",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Meeting Rooms"
            value={commercial.meetingRooms || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "meetingRooms",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Conference Rooms"
            value={commercial.conferenceRooms || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "conferenceRooms",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Seats"
            value={commercial.seats || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "seats",
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
              value={commercial.facing || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
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
          <CounterField
            label="Parking Capacity"
            value={commercial.parkingCapacity || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "parkingCapacity",
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
          value={commercial.amenities || []}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
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
          value={commercial.carpetArea || ""}
          placeholder="e.g. 1200"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "carpetArea",
                value,
              })
            )
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Super Built-up Area (sq ft)"
            type="number"
            value={commercial.superBuiltUpArea || ""}
            placeholder="Optional"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "superBuiltUpArea",
                  value,
                })
              )
            }
          />

          <InputField
            label="Floor Number"
            type="number"
            value={commercial.floorNumber || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "floorNumber",
                  value,
                })
              )
            }
          />

          <InputField
            label="Total Floors"
            type="number"
            value={commercial.totalFloors || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "totalFloors",
                  value,
                })
              )
            }
          />

          <InputField
            label="Ceiling Height (ft)"
            type="number"
            value={commercial.ceilingHeightFt || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "ceilingHeightFt",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      <IconCardSelect
        label="Property Type"
        value={commercial.propertyType}
        options={COMMERCIAL_PROPERTY_OPTIONS}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType: "commercial",
              key: "propertyType",
              value,
            })
          )
        }
      />

      {/* ========== PANTRY ========== */}
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-700">Pantry</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="inline-block text-sm font-normal p-1 bg-gray-400 text-white rounded-t-sm">
              Pantry Type
            </label>
            <select
              value={commercial.pantry?.type || ""}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "pantry",
                    value: { ...commercial.pantry, type: e.target.value },
                  })
                )
              }
              className="w-full border px-3 py-2 rounded-b-sm rounded-r-sm"
            >
              <option value="">Select</option>
              {PANTRY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={commercial.pantry?.insidePremises || false}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "pantry",
                    value: {
                      ...commercial.pantry,
                      insidePremises: e.target.checked,
                    },
                  })
                )
              }
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-sm text-gray-700">Inside Premises</span>
          </div>

          <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={commercial.pantry?.shared || false}
            onChange={(e) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "pantry",
                  value: { ...commercial.pantry, shared: e.target.checked },
                })
              )
            }
            className="w-4 h-4 accent-green-600"
          />
            <span className="text-sm text-gray-700">Shared</span>
          </div>
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
            {CONSTRUCTION_STATUS.map((status) => {
              const active = commercial.constructionStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
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
        {commercial.constructionStatus === "under-construction" && (
          <InputField
            label="Expected Possession Date"
            type="date"
            value={commercial.possessionDate || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
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
            {FURNISHED_STATUS.map((status) => {
              const active = commercial.furnishedStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "furnishedStatus",
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
      </div>

      {/* ================= Property Condition ================= */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Property Condition</p>

        <InputField
          label="Built Year"
          type="number"
          placeholder="e.g. 2019"
          value={commercial.builtYear || ""}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "builtYear",
                value,
              })
            )
          }
        />
      </div>

      {/* ================= Facilities ================= */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Facilities</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Power Backup"
            placeholder="e.g. Full, Partial"
            value={commercial.powerBackup || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "powerBackup",
                  value,
                })
              )
            }
          />
          <InputField
            label="Power Capacity (KW)"
            type="number"
            value={commercial.powerCapacityKw || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "powerCapacityKw",
                  value,
                })
              )
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: "lift", label: "Lift" },
            { key: "fireSafety", label: "Fire Safety" },
            { key: "loadingDock", label: "Loading Dock" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between border px-4 py-2 rounded-md"
            >
              <span className="text-sm text-gray-700">{item.label}</span>
              <input
                type="checkbox"
                checked={commercial[item.key] || false}
                onChange={(e) =>
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: item.key,
                      value: e.target.checked,
                    })
                  )
                }
                className="w-5 h-5 accent-green-600"
              />
            </div>
          ))}
        </div>

        {commercial.loadingDock && (
          <TextArea
            label="Loading Dock Details"
            value={commercial.loadingDockDetails || ""}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "loadingDockDetails",
                  value,
                })
              )
            }
          />
        )}

        <InputField
          label="Maintenance Charges"
          type="number"
          value={commercial.maintenanceCharges || ""}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "maintenanceCharges",
                value,
              })
            )
          }
        />
      </div>

      {/* ================= Building Management ================= */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Building Management</p>

        <div className="flex items-center justify-between border px-4 py-2 rounded-md">
          <span className="text-sm text-gray-700">Security Available</span>
          <input
            type="checkbox"
            checked={commercial.buildingManagement?.security || false}
            onChange={(e) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "buildingManagement",
                  value: {
                    ...commercial.buildingManagement,
                    security: e.target.checked,
                  },
                })
              )
            }
            className="w-5 h-5 accent-green-600"
          />
        </div>

        <InputField
          label="Managed By"
          value={commercial.buildingManagement?.managedBy || ""}
          placeholder="e.g. Association, Agency"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "buildingManagement",
                value: {
                  ...commercial.buildingManagement,
                  managedBy: value,
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

export default CommercialProfile;
