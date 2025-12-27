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
    "east-facing", "west-facing", "north-facing", "south-facing",
    "gated-community", "non-gated", "corner", "road-facing",
    "two-side-open", "three-side-open", "resale", "new-plot"
];

// use shared `AMENITIES` constant for options

const LandProfile = () => {
    const { land } = useSelector((state: any) => state.postProperty);
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Ensure dimensions exists and are strings to satisfy backend validation
        const lengthVal = land?.dimensions?.length ?? "";
        const widthVal = land?.dimensions?.width ?? "";
        if (!land?.dimensions || typeof lengthVal !== "string" || typeof widthVal !== "string") {
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
            {/* 1. PLOT DIMENSIONS & AREA */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-4">
                    <InputField
                        label="Plot Area"
                        type="number"
                        value={land.plotArea ?? ""}
                        placeholder="e.g. 1200"
                        onChange={(value) =>
                            dispatch(setProfileField({ propertyType: "land", key: "plotArea", value }))
                        }
                    />

                    <Dropdownui
                        label="Unit"
                        placeholder="Select"
                        options={AREA_UNITS.map((unit) => ({
                            label: unit.toUpperCase(),
                            value: unit,
                        }))}
                        value={land.areaUnit}
                        onChange={(value) =>
                            dispatch(setProfileField({ propertyType: "land", key: "areaUnit", value }))
                        }
                    />

                    <InputField
                        label="Total Price"
                        type="number"
                        value={land.price ?? ""}
                        placeholder="e.g. 500000"
                        onChange={(value) =>
                            dispatch(setProfileField({ propertyType: "land", key: "price", value }))
                        }
                    />

                    <InputField
                        label="Road Width (ft)"
                        type="number"
                        value={land.roadWidthFt ?? ""}
                        placeholder="e.g. 40"
                        onChange={(value) =>
                            dispatch(setProfileField({ propertyType: "land", key: "roadWidthFt", value }))
                        }
                    />
                </div>


                {/* Plot Boundaries */}
                <div className="rounded-md border border-blue-200 bg-blue-50/40 p-5">
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
                              ${active
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
                        value={land.approvedByAuthority || []}
                        onChange={(value) =>
                            dispatch(
                                setProfileField({
                                    propertyType: "land",
                                    key: "approvedByAuthority",
                                    value, // 👈 string[]
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

            {/* 2. INFRASTRUCTURE & LEGAL */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Infrastructure & Legal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={land.readyToConstruct || false}
                            onChange={(e) =>
                                dispatch(setProfileField({ propertyType: "land", key: "readyToConstruct", value: e.target.checked }))
                            }
                            className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm text-gray-700">Ready to Build</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={land.waterConnection || false}
                            onChange={(e) =>
                                dispatch(setProfileField({ propertyType: "land", key: "waterConnection", value: e.target.checked }))
                            }
                            className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm text-gray-700">Water Supply</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={land.electricityConnection || false}
                            onChange={(e) =>
                                dispatch(setProfileField({ propertyType: "land", key: "electricityConnection", value: e.target.checked }))
                            }
                            className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm text-gray-700">Electricity</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={land.fencing || false}
                            onChange={(e) =>
                                dispatch(setProfileField({ propertyType: "land", key: "fencing", value: e.target.checked }))
                            }
                            className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm text-gray-700">Fenced</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Survey Number"
                        value={land.surveyNumber || ""}
                        placeholder="e.g. 123/45/B"
                        onChange={(value) =>
                            dispatch(setProfileField({ propertyType: "land", key: "surveyNumber", value }))
                        }
                    />

                    <InputField
                        label="Land Use Zone"
                        value={land.landUseZone || ""}
                        placeholder="e.g. Residential Zone A"
                        onChange={(value) =>
                            dispatch(setProfileField({ propertyType: "land", key: "landUseZone", value }))
                        }
                    />

                    <InputField
                        label="Layout Type"
                        value={land.layoutType || ""}
                        placeholder="e.g. Gated Layout"
                        onChange={(value) => dispatch(setProfileField({ propertyType: "land", key: "layoutType", value }))}
                    />
                </div>

                {/* Property Type */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                    <select
                        value={land.propertyType || ""}
                        onChange={(e) => dispatch(setProfileField({ propertyType: "land", key: "propertyType", value: e.target.value }))}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Property Type</option>
                        {PLOT_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type.replace(/-/g, " ").toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 3. MEDIA & AMENITIES */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Media & Amenities</h3>

                {/* Common Amenities */}
                <AmenitiesSelect
                    label="Common Amenities"
                    options={AMENITIES}
                    value={land.amenities || []}
                    onChange={(value) =>
                        dispatch(setProfileField({ propertyType: "land", key: "amenities", value }))
                    }
                />

                {/* Additional Description */}
                <TextArea
                    label="Additional Description"
                    value={land.description || ""}
                    maxLength={500}
                    onChange={(value) => dispatch(setProfileField({ propertyType: "land", key: "description", value }))}
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