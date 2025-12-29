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
import { FACING_TYPES } from "./ResidentialProfile";
import Dropdownui from "@/ui/DropDownUI";
import Toggle from "@/ui/ToggleSwitch";
import { useEffect } from "react";
import SelectableButton from "@/ui/SelectableButton";

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

export const PANTRY_TYPES = ["none", "shared", "no-shared"] as const;

export const WALL_FINISH_STATUS = [
  "no-partitions",
  "brick-walls",
  "cement-block-walls",
  "plastered-walls",
] as const;

export const FLOORING_TYPES = [
  "bare-cement",
  "vitrified-tiles",
  "ceramic-tiles",
  "marble",
  "granite",
  "carpet",
  "epoxy",
  "wooden-laminate",
] as const;

const CommercialProfile = () => {
  const { commercial } = useSelector((state: any) => state.postProperty);
  const dispatch = useAppDispatch();
  useEffect(() => {
    const price = Number(commercial.price) || Number(commercial.expectedPrice);
    const area = Number(commercial.carpetArea);

    if (price > 0 && area > 0) {
      const pricePerSqft = String(Math.round(price / area));
      if (pricePerSqft !== commercial.pricePerSqft) {
        dispatch(
          setProfileField({
            propertyType: "commercial",
            key: "pricePerSqft",
            value: pricePerSqft,
          })
        );
      }
    } else {
      if (commercial.pricePerSqft) {
        dispatch(
          setProfileField({
            propertyType: "commercial",
            key: "pricePerSqft",
            value: "",
          })
        );
      }
    }
  }, [
    commercial.price,
    commercial.expectedPrice,
    commercial.carpetArea,
    commercial.pricePerSqft,
    dispatch,
  ]);

  return (
    <div className="space-y-8">
      {/* ========== PROPERTY BASICS ========== */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_145px] gap-1 items-start">
          {/* Furnishing */}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Furnishing</p>

            <div className="flex gap-5">
              {[
                { label: "Furnished", value: "fully-furnished" },
                { label: "Semi furnished", value: "semi-furnished" },
                { label: "Un-furnished", value: "unfurnished" },
              ].map((item) => {
                const active = commercial.furnishing === item.value;

                return (
                  <SelectableButton
                    key={item.value}
                    label={item.label}
                    active={active}
                    onClick={() =>
                      dispatch(
                        setProfileField({
                          propertyType: "commercial",
                          key: "furnishing",
                          value: item.value,
                        })
                      )
                    }
                  />
                );
              })}
            </div>
          </div>
          {/* Wall Finish */}
          <Dropdownui
            label="Wall Finish"
            value={commercial.wallFinishStatus || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "wallFinishStatus",
                  value,
                })
              )
            }
            options={WALL_FINISH_STATUS.map((t) => ({
              value: t,
              label: t.replace(/-/g, " "),
            }))}
            placeholder="Select"
          />
        </div>
        <div>
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
        <div className="space-y-3">
          {/* Section Title */}
          <p className="text-sm font-medium text-gray-800">
            Parking Details (Optional)
          </p>

          {/* Fields */}
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3">
            {/* Two Wheeler */}
            <CounterField
              label="Two-Wheeler Parking"
              value={commercial.parkingDetails?.twoWheeler || 0}
              min={0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "parkingDetails",
                    value: {
                      ...commercial.parkingDetails,
                      twoWheeler: value,
                    },
                  })
                )
              }
            />

            {/* Four Wheeler */}
            <CounterField
              label="Four-Wheeler Parking"
              value={commercial.parkingDetails?.fourWheeler || 0}
              min={0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "parkingDetails",
                    value: {
                      ...commercial.parkingDetails,
                      fourWheeler: value,
                    },
                  })
                )
              }
            />
          </div>
        </div>
        <div className="space-y-3">
          {/* Section Title */}
          <p className="text-sm font-medium text-gray-800">Floor Details</p>

          {/* Fields */}
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3 items-start">
            {/* Flooring Type */}
            <Dropdownui
              label="Flooring Type"
              value={commercial.flooringType || null}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "flooringType",
                    value,
                  })
                )
              }
              options={FLOORING_TYPES.map((t) => ({
                value: t,
                label: t.replace("-", " "),
              }))}
              placeholder="Select"
            />

            {/* Floor Number */}
            <CounterField
              label="Floor Number"
              min={0}
              value={commercial.floorNumber ?? 0}
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

            {/* Total Floors */}
            <CounterField
              label="Total Floors"
              min={0}
              value={commercial.totalFloors ?? 0}
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
          </div>
        </div>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 items-end">
          <Dropdownui
            label="Pantry Type"
            value={commercial.pantry?.type || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "pantry",
                  value: { ...commercial.pantry, type: value },
                })
              )
            }
            options={PANTRY_TYPES.map((t) => ({
              value: t,
              label: t.replace("-", " ").toUpperCase(),
            }))}
            placeholder="Select"
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Inside Premises
            </label>

            <div
              className="flex py-2 items-center justify-between rounded-md border
               border-gray-300 bg-white px-4
               shadow-sm transition
               hover:border-gray-400 mt-2"
            >
              <span className="text-sm text-gray-700">Available</span>

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
                className="h-5 w-5 accent-green-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Shared Pantry
            </label>
            <div className="flex py-2 items-center justify-between rounded-md border border-gray-300 bg-white px-4 shadow-sm transition hover:border-gray-400 mt-2">
              <span className="text-sm text-gray-700">Available</span>
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
                className="h-5 w-5 accent-green-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Availability Status
          </p>

          <div className="flex gap-5">
            {[
              { label: "Ready to Move", value: "ready-to-move" },
              { label: "Under Construction", value: "under-construction" },
            ].map((item) => {
              const active = commercial.constructionStatus === item.value;

              return (
                <SelectableButton
                  key={item.value}
                  label={item.label}
                  active={active}
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "constructionStatus",
                        value: item.value,
                      })
                    )
                  }
                />
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Transaction Type</p>

          <div className="flex gap-5">
            {[
              { label: "New Sale", value: "new-sale" },
              { label: "Resale", value: "resale" },
            ].map((item) => {
              const active = commercial.transactionType === item.value;

              return (
                <SelectableButton
                  key={item.value}
                  label={item.label}
                  active={active}
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "transactionType",
                        value: item.value,
                      })
                    )
                  }
                />
              );
            })}
          </div>
        </div>
        {commercial.constructionStatus === "ready-to-move" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Property Age</p>

            <div className="flex flex-wrap gap-3">
              {[
                { value: "0-1-year", label: "0-1 Year" },
                { value: "1-5-years", label: "1-5 Years" },
                { value: "5-10-years", label: "5-10 Years" },
                { value: "10-plus-years", label: "10+ Years" },
              ].map((item) => {
                const active = commercial.propertyAge === item.value;

                return (
                  <SelectableButton
                    key={item.value}
                    label={item.label}
                    active={active}
                    onClick={() =>
                      dispatch(
                        setProfileField({
                          propertyType: "commercial",
                          key: "propertyAge",
                          value: item.value,
                        })
                      )
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

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
      </div>

      {/* ========== BUILDING MANAGEMENT ========== */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Building Management
          </p>
          <p className="text-xs text-gray-500">
            Provide building management details
          </p>
        </div>

        <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-7">
          <InputField
            label="Building Management Company"
            value={commercial.buildingManagement?.managedBy || ""}
            placeholder="e.g. ABC Property Management"
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

          <InputField
            label="Management Contact"
            value={commercial.buildingManagement?.contact || ""}
            placeholder="e.g. +91-XXXXXXXXXX"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "buildingManagement",
                  value: {
                    ...commercial.buildingManagement,
                    contact: value,
                  },
                })
              )
            }
          />
        </div>
      </div>

      {/* ========== ZONING ========== */}
      <div className="space-y-3">
        <InputField
          label="Zoning Information"
          value={commercial.zoning || ""}
          placeholder="e.g. Commercial Zone B2"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "zoning",
                value,
              })
            )
          }
        />
      </div>

      {/* ========== TENANT INFORMATION ========== */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Tenant Information
          </p>
          <p className="text-xs text-gray-500">
            Add details about current or previous tenants
          </p>
        </div>

        {(commercial.tenantInfo || []).map((tenant: any, index: number) => (
          <div
            key={index}
            className="border rounded-lg p-4 border-gray-300 px-4 shadow-sm transition hover:border-gray-400 mt-2"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">
                Tenant #{index + 1}
              </p>
              <button
                type="button"
                onClick={() => {
                  const updatedTenants =
                    commercial.tenantInfo?.filter(
                      (_: any, i: number) => i !== index
                    ) || [];
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "tenantInfo",
                      value: updatedTenants,
                    })
                  );
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InputField
                label="Tenant Name"
                value={tenant.currentTenant || ""}
                placeholder="e.g. ABC Corporation"
                onChange={(value) => {
                  const updatedTenants = [...(commercial.tenantInfo || [])];
                  updatedTenants[index] = { ...tenant, currentTenant: value };
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "tenantInfo",
                      value: updatedTenants,
                    })
                  );
                }}
              />

              <InputField
                label="Monthly Rent"
                value={tenant.rent || ""}
                placeholder="e.g. 50,000"
                onChange={(value) => {
                  const updatedTenants = [...(commercial.tenantInfo || [])];
                  updatedTenants[index] = {
                    ...tenant,
                    rent: value.replace(/\D/g, ""),
                  };
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "tenantInfo",
                      value: updatedTenants,
                    })
                  );
                }}
              />

              <InputField
                label="Lease Start Date"
                type="date"
                value={tenant.leaseStart ? tenant.leaseStart.split("T")[0] : ""}
                onChange={(value) => {
                  const updatedTenants = [...(commercial.tenantInfo || [])];
                  updatedTenants[index] = { ...tenant, leaseStart: value };
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "tenantInfo",
                      value: updatedTenants,
                    })
                  );
                }}
              />

              <InputField
                label="Lease End Date"
                type="date"
                value={tenant.leaseEnd ? tenant.leaseEnd.split("T")[0] : ""}
                onChange={(value) => {
                  const updatedTenants = [...(commercial.tenantInfo || [])];
                  updatedTenants[index] = { ...tenant, leaseEnd: value };
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "tenantInfo",
                      value: updatedTenants,
                    })
                  );
                }}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            const newTenant = {
              currentTenant: "",
              leaseStart: "",
              leaseEnd: "",
              rent: "",
            };
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "tenantInfo",
                value: [...(commercial.tenantInfo || []), newTenant],
              })
            );
          }}
          className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:text-gray-700 hover:border-gray-400 transition"
        >
          + Add Tenant
        </button>
      </div>

      <div className="space-y-4">
        {/* Section Header */}
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Fire Safety & Compliance
          </p>
          <p className="text-xs text-gray-500">
            Select all fire safety measures available in the property
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: "fireExtinguisher", label: "Fire Extinguisher" },
            { key: "fireSprinklerSystem", label: "Sprinkler System" },
            { key: "fireHoseReel", label: "Fire Hose Reel" },
            { key: "fireHydrant", label: "Fire Hydrant" },
            { key: "smokeDetector", label: "Smoke Detector" },
            { key: "fireAlarmSystem", label: "Fire Alarm System" },
            { key: "fireControlPanel", label: "Fire Control Panel" },
            { key: "emergencyExitSignage", label: "Fire Exit Signs" },
          ].map((item) => {
            const enabled = commercial.fireSafety?.[item.key] || false;

            return (
              <div
                key={item.key}
                className={`flex items-center justify-between rounded-md border p-3 shadow-sm transition
            ${
              enabled
                ? "border-green-500 bg-green-50 shadow-sm"
                : "border-gray-300 bg-white"
            }`}
              >
                <span
                  className={`text-sm font-medium ${
                    enabled ? "text-green-700" : "text-gray-700"
                  }`}
                >
                  {item.label}
                </span>

                <Toggle
                  enabled={enabled}
                  onChange={(val) =>
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "fireSafety",
                        value: { ...commercial.fireSafety, [item.key]: val },
                      })
                    )
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-800">Price Details</p>

        {/* Changed to grid-cols-4 for desktop, added items-end for alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <InputField
            label="Total Price"
            value={commercial.price || ""}
            placeholder="e.g. 75,00,000"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "price",
                  value: value.replace(/\D/g, ""),
                })
              )
            }
          />

          <InputField
            label="Carpet Area (sq ft)"
            value={commercial.carpetArea || ""}
            placeholder="e.g. 1200"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "carpetArea",
                  value: value.replace(/\D/g, ""),
                })
              )
            }
          />

          <InputField
            label="Price / sq ft"
            value={commercial.pricePerSqft || ""}
            placeholder="Auto calculated"
            disabled
            onChange={() => {}}
          />

          <InputField
            label="Built-up (sq ft)"
            type="number"
            value={commercial.builtUpArea || ""}
            placeholder="eg. 2000"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "builtUpArea",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      <div
        className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 ${
          commercial.isPriceNegotiable ? "border-green-500 bg-green-50 shadow-sm" : ""
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
              commercial.isPriceNegotiable ? "text-green-600" : "text-gray-400"
            }`}
          >
            {commercial.isPriceNegotiable ? "YES" : "NO"}
          </span>
          <Toggle
            enabled={commercial.isPriceNegotiable || false}
            onChange={(val) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "isPriceNegotiable",
                  value: val,
                })
              )
            }
          />
        </div>
      </div>
      <TextArea
        label="Property Description"
        value={commercial.description || ""}
        placeholder="e.g. Spacious 3 BHK apartment with east-facing balcony, covered parking, power backup, and close to IT parks."
        maxLength={500}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType: "commercial",
              key: "description",
              value,
            })
          )
        }
      />

      <button
        type="button"
        onClick={() => {
          dispatch(submitPropertyThunk())
            .unwrap()
            .then((response) => {
              console.log("Property submission successful:", response);
            })
            .catch((error) => {
              console.error("Property submission failed:", error);
            });
        }}
        className="py-2 btn-primary text-white rounded-md cursor-pointer w-full"
      >
        Submit Property
      </button>
    </div>
  );
};

export default CommercialProfile;
