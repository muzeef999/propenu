import { useSelector } from "react-redux";
import { useEffect } from "react";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import InputField from "@/ui/InputFiled";
import TextArea from "@/ui/TextArae";
import AmenitiesSelect from "./AmenitiesSelect";
import { AMENITIES } from "../constants/amenities";
import { useAppDispatch } from "@/Redux/store";
import { submitPropertyThunk } from "@/Redux/thunks/submitPropertyApi";
import Dropdownui from "@/ui/DropDownUI";
import Toggle from "@/ui/ToggleSwitch";
import InputWithUnit from "@/ui/InputwithUnit";

const AREA_UNITS = ["sqft"] as const;

const PLOT_TYPES = [
  "plot",
  "residential-plot",
  "commercial-plot",
  "industrial-plot",
  "investment-plot",
  "corner-plot",
  "na-plot",
] as const;
const LAND_APPROVAL_AUTHORITIES = [
  "dtcp",
  "hmda",
  "cmda",
  "bda",
  "mmrda",
  "cidco",
  "dda",
  "noida-authority",
  "greater-noida-authority",
  "puda",
  "hsvp",
  "guda",
  "auDA",
  "panchayat",
  "municipal-corporation",
];

const FACING_OPTIONS = [
  "East",
  "West",
  "North",
  "South",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];

const PLOT_SUBTYPES = [
  "east-facing",
  "west-facing",
  "north-facing",
  "south-facing",
  "gated-community",
  "non-gated",
  "corner",
  "road-facing",
  "two-side-open",
  "three-side-open",
  "resale",
  "new-plot",
];

// use shared `AMENITIES` constant for options

const LandProfile = () => {
  const { land } = useSelector((state: any) => state.postProperty);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Ensure dimensions exists and are strings to satisfy backend validation
    const lengthVal = land?.dimensions?.length ?? "";
    const widthVal = land?.dimensions?.width ?? "";
    if (
      !land?.dimensions ||
      typeof lengthVal !== "string" ||
      typeof widthVal !== "string"
    ) {
      dispatch(
        setProfileField({
          propertyType: "land",
          key: "dimensions",
          value: { length: String(lengthVal), width: String(widthVal) },
        })
      );
    }
  }, [land?.dimensions, dispatch]);

  return (
    <div className="space-y-8">
      {/* 1. PLOT DETAILS */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">Plot Details</p>
          <p className="text-xs text-gray-500">
            Provide essential information about the plot.
          </p>
        </div>

        {/* Plot Boundaries */}
        <div className="rounded-md border border-green-500 bg-green-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Plot Dimensions (Optional)
              </p>
              <p className="text-xs text-gray-500">
                Enter length and width in feet
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            {/* Length */}
            <InputField
              label="Length"
              type="number"
              placeholder="e.g. 40"
              value={land.dimensions?.length ?? ""}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "land",
                    key: "dimensions",
                    value: {
                      length: value,
                      width: land.dimensions?.width || "",
                    },
                  })
                )
              }
            />

            {/* Multiply symbol */}
            <div className="hidden sm:flex items-center justify-center pb-2">
              <span className="text-xl font-semibold text-gray-400">×</span>
            </div>

            {/* Width */}
            <InputField
              label="Width"
              type="number"
              placeholder="e.g. 60"
              value={land.dimensions?.width ?? ""}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "land",
                    key: "dimensions",
                    value: {
                      length: land.dimensions?.length || "",
                      width: value,
                    },
                  })
                )
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1">
          {/* Furnishing */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Layout Type</p>

            <div className="flex gap-5">
              {[
                { label: "Approved Layout", value: "approved-layout" },
                { label: "Un-approved Layout", value: "unapproved-layout" },
                { label: "Gated Layout", value: "gated-layout" },
                { label: "Individual Plot", value: "individual-plot" },
              ].map((item) => {
                const active = land.layoutType === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      dispatch(
                        setProfileField({
                          propertyType: "land",
                          key: "layoutType",
                          value: item.value,
                        })
                      )
                    }
                    className={`px-6 py-2 border rounded-md text-sm shadow-sm focus:outline-none  transition-colors
                              ${
                                active
                                  ? "border-green-500 bg-green-50 text-green-600"
                                  : "border-gray-300 text-gray-700"
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

        {/* Facing Direction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Facing */}
          <Dropdownui
            label="Facing"
            value={land.facing || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "land",
                  key: "facing",
                  value,
                })
              )
            }
            options={FACING_OPTIONS.map((t) => ({
              value: t,
              label: t.replace(/-/g, " "),
            }))}
            placeholder="Select"
          />

          {/* Approved By Authority */}
          <Dropdownui
            label="Approved By Authority"
            value={land.approvedByAuthority || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "land",
                  key: "approvedByAuthority",
                  value,
                })
              )
            }
            options={LAND_APPROVAL_AUTHORITIES.map((a) => ({
              value: a,
              label: a.replace(/-/g, " ").toUpperCase(),
            }))}
            placeholder="Select approvals"
          />
        </div>
      </div>

      {/* 2. AMENITIES */}
      <div className="space-y-6">
        <AmenitiesSelect
          label="Amenities"
          options={AMENITIES}
          value={land.amenities || []}
          onChange={(value) =>
            dispatch(
              setProfileField({ propertyType: "land", key: "amenities", value })
            )
          }
        />
      </div>

      {/* 3. LEGAL & SURVEY DETAILS */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Legal & Survey Details
          </p>
          <p className="text-xs text-gray-500">Survey and zoning information</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Survey Number"
            value={land.surveyNumber || ""}
            placeholder="e.g. 123/45/B"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "land",
                  key: "surveyNumber",
                  value,
                })
              )
            }
          />

          <InputField
            label="Land Use Zone"
            value={land.landUseZone || ""}
            placeholder="e.g. Residential Zone A"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "land",
                  key: "landUseZone",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      {/* 4. PLOT FEATURES & UTILITIES */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Plot Features & Utilities
          </p>
          <p className="text-xs text-gray-500">
            Select all features available for this plot
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: "readyToConstruct", label: "Ready to Construct" },
            { key: "waterConnection", label: "Water Connection" },
            { key: "electricityConnection", label: "Electricity Connection" },
            { key: "cornerPlot", label: "Corner Plot" },
            { key: "fencing", label: "Fencing" },
          ].map((item) => {
            const enabled = Boolean(land[item.key as keyof typeof land]);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  dispatch(
                    setProfileField({
                      propertyType: "land",
                      key: item.key,
                      value: !enabled,
                    })
                  )
                }
                className={`
          flex items-center justify-between gap-3
          rounded-md border p-3 text-left
          transition-all duration-150
          ${
            enabled
              ? "border-green-500 bg-green-50 shadow-sm"
              : "border-gray-300 bg-white hover:border-gray-400"
          }
        `}
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
                        propertyType: "land",
                        key: item.key,
                        value: val,
                      })
                    )
                  }
                />
              </button>
            );
          })}
        </div>
      </div>
      {/* 5. PRICE & OTHER DETAILS */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Price Details</p>
            <p className="text-xs text-gray-500">
              Enter pricing and area details for this property
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <InputField
              label="Total Price"
              value={land.price || ""}
              placeholder="e.g. 75,00,000"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "land",
                    key: "price",
                    value: value.replace(/\D/g, ""),
                  })
                )
              }
            />

            <InputField
              label="Price Per Sqft"
              value={land.pricePerSqft || ""}
              placeholder="e.g. 6250"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "land",
                    key: "pricePerSqft",
                    value: value.replace(/\D/g, ""),
                  })
                )
              }
            />
            <InputWithUnit
              label="Plot Area"
              value={land.plotArea}
              unitValue={land.areaUnit}
              units={[{ label: "SQ.FT", value: "sqft" }]}
              placeholder="1200"
              onValueChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "land",
                    key: "plotArea",
                    value,
                  })
                )
              }
              onUnitChange={(unit) =>
                dispatch(
                  setProfileField({
                    propertyType: "land",
                    key: "areaUnit",
                    value: unit,
                  })
                )
              }
            />

            <InputField
              label="Road Width (ft)"
              type="number"
              value={land.roadWidthFt ?? ""}
              placeholder="e.g. 40"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "land",
                    key: "roadWidthFt",
                    value,
                  })
                )
              }
            />
          </div>
        </div>

        <div
          className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 ${
            land.isPriceNegotiable
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
                land.isPriceNegotiable ? "text-green-600" : "text-gray-400"
              }`}
            >
              {land.isPriceNegotiable ? "YES" : "NO"}
            </span>
            <Toggle
              enabled={land.isPriceNegotiable || false}
              onChange={(val) =>
                dispatch(
                  setProfileField({
                    propertyType: "land",
                    key: "isPriceNegotiable",
                    value: val,
                  })
                )
              }
            />
          </div>
        </div>

        <TextArea
          label="Additional Description"
          value={land.description || ""}
          placeholder="e.g. This plot is located in a prime area with easy access to main roads..."
          maxLength={500}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "land",
                key: "description",
                value,
              })
            )
          }
        />
      </div>
      <button
        type="button"
        onClick={() => {
          console.log("Submitting Land...");
          dispatch(submitPropertyThunk("land"))
            .unwrap()
            .then((res) => console.log("Success:", res))
            .catch((err) => console.error("Error:", err));
        }}
        className="px-6 py-3 bg-green-600 text-white rounded-md cursor-pointer"
      >
        Submit Property
      </button>
    </div>
  );
};

export default LandProfile;
