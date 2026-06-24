import { useDispatch, useSelector } from "react-redux";
import {
  setPropertyType,
  nextStep,
  setBaseField,
  setProfileField,
  setDraftId,
  setStep,
} from "@/Redux/slice/postPropertySlice";
import SelectableButton from "@/ui/SelectableButton";

import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { useEffect, useState } from "react";
import { validateBasicDetails } from "@/zod/basicDetailsZod";
import Cookies from "js-cookie";
import { useSearchParams } from "next/navigation";
import {
  RESIDENTIAL_PROPERTY_OPTIONS,
  COMMERCIAL_PROPERTY_OPTIONS,
  COMMERCIAL_SUBTYPE_MAP,
  PROJECT_PROPERTY_OPTIONS,
  LAND_PROPERTY_OPTIONS,
  LAND_PROPERTY_SUBTYPES,
  AGRICULTURAL_PROPERTY_OPTIONS,
  AGRICULTURAL_PROPERTY_SUBTYPES,
} from "@/app/(pages)/postproperty/constants/subTypes";
import InputField from "@/ui/InputField";
import LoginDialog from "@/app/(auth)/Login";
import { submitBasicThunk } from "@/Redux/thunks/submitPropertyApi";
import { createDraftApi } from "@/Redux/apis";
import { AppDispatch } from "@/Redux/store";
import CounterField from "@/ui/CounterField";
import Dropdownui from "@/ui/DropDownUI";
import { FACING_TYPES } from "../profile/ResidentialProfile";
import { numberToWords } from "@/utilies/NumberToWord";
import { property } from "zod";
import PricingDetails from "../components/PricingDetails";
import { InfoIcon } from "@/icons/icons";

import { useAppDispatch, useAppSelector } from "@/Redux/store";
import RegisterDialog from "@/app/(auth)/Register";

function getProjectBackendCategory(projectPropertyType?: string) {
  if (["apartment", "villa"].includes(projectPropertyType ?? "")) {
    return "residential";
  }

  if (["open-plot", "commercial-plot"].includes(projectPropertyType ?? "")) {
    return "land";
  }

  return "project";
}

function normalizeProjectPropertyTypeForBackend(projectPropertyType?: string) {
  if (projectPropertyType === "open-plot") return "residential-plot";
  return projectPropertyType;
}

export default function BasicDetailsStep() {
  const searchParams = useSearchParams();
  const isEditMode = Boolean(searchParams.get("editId"));
  const {
    propertyType,
    base,
    residential,
    commercial,
    land,
    agricultural,
    project,
    draftId,
  } = useAppSelector((state) => state.postProperty);

  const WALL_FINISH_STATUS = [
    "no-partitions",
    "brick-walls",
    "cement-block-walls",
    "plastered-walls",
  ] as const;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [canPostProject, setCanPostProject] = useState(false);
  // const dispatch = useDispatch<AppDispatch>();

  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);

    if (typeof window !== "undefined") {
      const normalizedRole = String(localStorage.getItem("role") ?? "")
        .toLowerCase()
        .replace(/[-\s]+/g, "_");

      setCanPostProject(
        normalizedRole === "agent" || normalizedRole === "sales_agent",
      );
    }
  }, []);

  useEffect(() => {
    if (!canPostProject && propertyType === "project") {
      dispatch(setPropertyType("residential"));
    }
  }, [canPostProject, dispatch, propertyType]);

  // useEffect(() => {
  //   if (!propertyType) {
  //     dispatch(setPropertyType("residential"));
  //   }
  // }, [propertyType, dispatch]);

  useEffect(() => {
    if (propertyType === "residential") {
      if (residential.propertyType) setShowRoomDetails(true);
      if (residential.facing) setShowPricing(true);
    } else if (
      propertyType === "project" &&
      ["apartment", "villa"].includes(project.propertyType)
    ) {
      setShowRoomDetails(true);
      if (project.facing) setShowPricing(true);
    } else {
      // Reset when switching away from residential
      setShowRoomDetails(false);
      setShowPricing(false);
    }
  }, [propertyType, residential, project]);

  const listingOptions = [
    { label: "Sale", value: "sale" },
    { label: "Rent / Lease", value: "rent" },
  ];

  // Get the current category state
  const categoryState =
    propertyType === "residential"
      ? residential
      : propertyType === "commercial"
        ? commercial
        : propertyType === "land"
          ? land
          : propertyType === "agricultural"
            ? agricultural
            : project;

  const profileData =
    propertyType === "residential"
      ? residential
      : propertyType === "commercial"
        ? commercial
        : propertyType === "land"
          ? land
          : propertyType === "agricultural"
            ? agricultural
            : project;

  const isProjectResidentialFlow =
    propertyType === "project" &&
    ["apartment", "villa"].includes(project.propertyType);
  const residentialFlowData = isProjectResidentialFlow ? project : residential;
  const residentialFlowPropertyType = isProjectResidentialFlow
    ? "project"
    : "residential";
  const showResidentialFlow =
    (propertyType === "residential" && showRoomDetails) ||
    isProjectResidentialFlow;
  const isProjectLandFlow =
    propertyType === "project" &&
    ["open-plot", "commercial-plot"].includes(project.propertyType);
  const landFlowData = isProjectLandFlow ? project : land;
  const landFlowPropertyType = isProjectLandFlow ? "project" : "land";
  const showLandFlow = propertyType === "land" || isProjectLandFlow;

  const validationResult = propertyType
    ? validateBasicDetails(
      {
        ...base,
        ...profileData,
        propertyType: profileData?.propertyType || base.propertyType,
      },
      propertyType,
    )
    : {
      success: false,
      error: null,
    };

  const isFormValid = validationResult?.success === true;

  const fieldErrors =
    showErrors && !validationResult.success && validationResult.error
      ? validationResult.error.flatten().fieldErrors
      : {};

  const handleSelect = (type: any) => {
    dispatch(setPropertyType(type));
  };

  const subTypes =
    propertyType === "residential"
      ? RESIDENTIAL_PROPERTY_OPTIONS
      : propertyType === "commercial"
        ? COMMERCIAL_PROPERTY_OPTIONS
        : propertyType === "land"
          ? LAND_PROPERTY_OPTIONS
          : propertyType === "agricultural"
            ? AGRICULTURAL_PROPERTY_OPTIONS
            : propertyType === "project"
              ? PROJECT_PROPERTY_OPTIONS
              : [];

  const selectedCommercialType = commercial.propertyType;
  const commercialSubTypes =
    propertyType === "commercial" &&
      selectedCommercialType &&
      COMMERCIAL_SUBTYPE_MAP[
      selectedCommercialType as keyof typeof COMMERCIAL_SUBTYPE_MAP
      ]
      ? (COMMERCIAL_SUBTYPE_MAP[
        selectedCommercialType as keyof typeof COMMERCIAL_SUBTYPE_MAP
      ] as readonly string[])
      : [];

  const contactLabel =
    base.listingType === "sale"
      ? "Your contact details for buyers to reach you"
      : "Your contact details for tenants to reach you";

  const landSubTypes =
    showLandFlow
      ? (LAND_PROPERTY_SUBTYPES as readonly string[])
      : [];

  const agriculturalSubTypes =
    propertyType === "agricultural"
      ? (AGRICULTURAL_PROPERTY_SUBTYPES as readonly string[])
      : [];

  const formatFacingForForm = (value?: string) =>
    value
      ?.trim()
      .toLowerCase()
      .replace(/^(north|south)(east|west)$/, "$1-$2");

  // ✅ map redux string → dropdown option
  const facingOption = residential.facing
    ? {
      label: residential.facing.toUpperCase(),
      value: residential.facing,
    }
    : null;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">Listing type</p>

      <div className="flex flex-wrap gap-3">
        {listingOptions.map((option) => {
          const isActive = base.listingType === option.value;

          return (
            <SelectableButton
              key={option.value}
              label={option.label}
              active={isActive}
              onClick={() =>
                dispatch(
                  setBaseField({
                    key: "listingType",
                    value: option.value,
                  }),
                )
              }
            />
          );
        })}
      </div>

      {/* ✅ ERROR MESSAGE BELOW BUTTON GROUP */}
      {showErrors && fieldErrors.listingType?.[0] && (
        <p className="text-xs text-red-500">{fieldErrors.listingType[0]}</p>
      )}

      <h2 className="text-sm font-medium text-gray-700">Property Type</h2>

      <div className="mb-2 flex flex-wrap items-center gap-3 sm:gap-6">
        {["residential", "commercial", "land", "agricultural", "project"]
          .filter((type) => type !== "project" || canPostProject)
          .filter((type) => !isEditMode || propertyType === type)
          .map((type) => (
          <label
            key={type}
            className={`flex items-center justify-center gap-2 ${
              isEditMode
                  ? "cursor-default"
                  : "cursor-pointer"
            }`}
          >
            <input
              type="radio"
              name="propertyType"
              className="scale-125"
              checked={propertyType === type}
              disabled={isEditMode}
              onChange={() => {
                if (isEditMode) return;
                handleSelect(type);
              }}
            />
            <span className="capitalize text-sm font-normal text-gray-700">
              {type === "land" ? "Plot / Land" : type}
            </span>
          </label>
        ))}
      </div>

      {/* ✅ ERROR MESSAGE */}
      {showErrors && fieldErrors.category?.[0] && (
        <p className="mt-1 text-xs text-red-500">{fieldErrors.category[0]}</p>
      )}

      {subTypes.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Property Sub-Type
          </p>
          <div className="space-y-6">
            {/* PROPERTY SUB TYPES */}
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {subTypes.map((sub) => {
                  const isSelected = categoryState?.propertyType === sub.key;

                  return (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => {
                        if (propertyType) {
                          dispatch(
                            setProfileField({
                              propertyType: propertyType as any,
                              key: "propertyType",
                              value: sub.key,
                            }),
                          );
                          if (
                            propertyType === "residential" ||
                            (propertyType === "project" &&
                              ["apartment", "villa"].includes(sub.key))
                          ) {
                            setShowRoomDetails(true);
                          }
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-all
            ${isSelected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }
          `}
                    >
                      <span className="text-2xl text-current [&_svg]:h-7 [&_svg]:w-7 [&_svg]:fill-current [&_svg]:text-current">
                        {sub.icon}
                      </span>
                      <span className="text-xs font-medium">{sub.label}</span>
                    </button>
                  );
                })}
              </div>

              {showErrors && fieldErrors.propertyType?.[0] && (
                <p className="mt-2 text-xs text-red-500">
                  {fieldErrors.propertyType[0]}
                </p>
              )}
            </div>

            {propertyType === "project" && project.propertyType && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InputField
                  label="Project Total Area"
                  type="number"
                  placeholder="e.g. 5"
                  value={project.projectArea ?? ""}
                  error={fieldErrors.projectArea?.[0]}
                  onChange={(value) =>
                    dispatch(
                      setProfileField({
                        propertyType: "project",
                        key: "projectArea",
                        value: value.replace(/[^0-9.]/g, ""),
                      }),
                    )
                  }
                />

                {project.propertyType !== "open-plot" && (
                  <InputField
                    label="No. of Towers"
                    type="number"
                    placeholder="e.g. 3"
                    value={project.totalTowers ?? ""}
                    error={fieldErrors.totalTowers?.[0]}
                    onChange={(value) =>
                      dispatch(
                        setProfileField({
                          propertyType: "project",
                          key: "totalTowers",
                          value: value.replace(/[^0-9]/g, ""),
                        }),
                      )
                    }
                  />
                )}

                <InputField
                  label="Total Units"
                  type="number"
                  placeholder="e.g. 240"
                  value={project.totalUnits ?? ""}
                  error={fieldErrors.totalUnits?.[0]}
                  onChange={(value) =>
                    dispatch(
                      setProfileField({
                        propertyType: "project",
                        key: "totalUnits",
                        value: value.replace(/[^0-9]/g, ""),
                      }),
                    )
                  }
                />

                <InputField
                  label="Available Units"
                  type="number"
                  placeholder="e.g. 36"
                  value={project.availableUnits ?? ""}
                  error={fieldErrors.availableUnits?.[0]}
                  onChange={(value) =>
                    dispatch(
                      setProfileField({
                        propertyType: "project",
                        key: "availableUnits",
                        value: value.replace(/[^0-9]/g, ""),
                      }),
                    )
                  }
                />
              </div>
            )}

            {/* RESIDENTIAL DETAILS */}
            {showResidentialFlow && (
              <div className="space-y-6">
                {/* Counters */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  <CounterField
                    label="Bedrooms"
                    value={residentialFlowData.bedrooms || 0}
                    min={1}
                    onChange={(value) => {
                      dispatch(
                        setProfileField({
                          propertyType: residentialFlowPropertyType,
                          key: "bedrooms",
                          value,
                        }),
                      );
                    }}
                    error={fieldErrors.bedrooms?.[0]}
                  />

                  <CounterField
                    label="Bathrooms"
                    value={residentialFlowData.bathrooms || 0}
                    min={1}
                    onChange={(value) => {
                      dispatch(
                        setProfileField({
                          propertyType: residentialFlowPropertyType,
                          key: "bathrooms",
                          value,
                        }),
                      );
                    }}
                    error={fieldErrors.bathrooms?.[0]}
                  />

                  <CounterField
                    label="Balconies"
                    value={residentialFlowData.balconies || 0}
                    min={0}
                    onChange={(value) => {
                      dispatch(
                        setProfileField({
                          propertyType: residentialFlowPropertyType,
                          key: "balconies",
                          value,
                        }),
                      );
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_145px] items-start">
                  {/* Furnishing */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Furnishing
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: "Furnished", value: "fully-furnished" },
                        { label: "Semi-Furnished", value: "semi-furnished" },
                        { label: "Unfurnished", value: "unfurnished" },
                      ].map((item) => {
                        const active =
                          residentialFlowData.furnishing === item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() =>
                              dispatch(
                                setProfileField({
                                  propertyType: residentialFlowPropertyType,
                                  key: "furnishing",
                                  value: item.value,
                                }),
                              )
                            }
                            className={`px-5 py-2 rounded-md text-sm border transition
                  ${active
                                ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }
                `}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    {showErrors && fieldErrors.furnishing?.[0] && (
                      <p className="text-xs text-red-500">
                        {fieldErrors.furnishing[0]}
                      </p>
                    )}
                  </div>

                  {/* Facing */}
                  <Dropdownui
                    label="Facing"
                    value={residentialFlowData.facing ?? null}
                    onChange={(value: string) => {
                      dispatch(
                        setProfileField({
                          propertyType: residentialFlowPropertyType,
                          key: "facing",
                          value, // already lowercase
                        })
                      );
                      setShowPricing(true);
                    }}
                    options={FACING_TYPES.map((dir) => ({
                      label: dir,              // "North"
                      value: dir.toLowerCase() // ✅ "north"
                    }))}
                    placeholder="Select"
                    error={fieldErrors.facing?.[0]}
                  />




                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {commercialSubTypes.length > 0 && (
        <>
          {/* Commercial Sub Types */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-gray-700">
              Specific Type for{" "}
              <span className="capitalize">
                {selectedCommercialType?.replace("-", " ")}
              </span>
            </p>

            <div className="flex flex-wrap gap-3">
              {commercialSubTypes.map((subType: string) => {
                const isSelected =
                  (commercial as any).commercialSubType === subType;

                return (
                  <button
                    key={subType}
                    type="button"
                    onClick={() =>
                      dispatch(
                        setProfileField({
                          propertyType: "commercial",
                          key: "commercialSubType",
                          value: subType,
                        }),
                      )
                    }
                    className={`px-4 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-colors ${isSelected
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-gray-300 text-gray-700"
                      }`}
                  >
                    {subType.replace("-", " ").toUpperCase()}
                  </button>
                );
              })}
            </div>
            {showErrors && fieldErrors.commercialSubType?.[0] && (
              <p className="text-xs text-red-500 mt-2">
                {fieldErrors.commercialSubType[0]}
              </p>
            )}
          </div>

          {/* Cabins & Seats - Show only if commercialSubType is selected */}
          {commercial.commercialSubType && (
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
                    }),
                  )
                }
                error={fieldErrors.cabins?.[0]}
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
                    }),
                  )
                }
                error={fieldErrors.seats?.[0]}
              />
            </div>
          )}

          {/* Furnishing, Facing & Wall Finish - Show only if Cabins or Seats has a value */}
          {(commercial.cabins > 0 ||
            commercial.seats > 0 ||
            (showErrors && fieldErrors.facing) ||
            (showErrors && fieldErrors.wallFinishStatus)) && (
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_145px_145px] gap-4 items-start">
                {/* Furnishing */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Furnishing</p>

                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: "Furnished", value: "fully-furnished" },
                      { label: "Semi furnished", value: "semi-furnished" },
                      { label: "Un-furnished", value: "unfurnished" },
                    ].map((item) => (
                      <SelectableButton
                        key={item.value}
                        label={item.label}
                        active={commercial.furnishedStatus === item.value}
                        onClick={() =>
                          dispatch(
                            setProfileField({
                              propertyType: "commercial",
                              key: "furnishedStatus",
                              value: item.value,
                            }),
                          )
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Facing */}
                <Dropdownui
                  label="Facing"
                  value={formatFacingForForm(commercial.facing) ?? null}
                  onChange={(value) =>
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "facing",
                        value,
                      }),
                    )
                  }
                  options={FACING_TYPES.map((dir) => ({
                    label: dir,
                    value: dir.toLowerCase(),
                  }))}
                  placeholder="Select"
                  error={fieldErrors.facing?.[0]}
                />

                {/* Wall Finish */}
                <Dropdownui
                  label="Wall Finish"
                  value={
                    WALL_FINISH_STATUS.find(
                      (t) => t === commercial.wallFinishStatus,
                    ) || null
                  }
                  onChange={(value) =>
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "wallFinishStatus",
                        value,
                      }),
                    )
                  }
                  options={WALL_FINISH_STATUS.map((t) => ({
                    value: t,
                    label: t.replace(/-/g, " "),
                  }))}
                  placeholder="Select"
                  error={fieldErrors.wallFinishStatus?.[0]}
                />
              </div>
            )}

          {/* Price Details - Show only if Wall Finish is selected */}
          {commercial.wallFinishStatus && (
            <PricingDetails
              propertyType="commercial"
              data={commercial}
              fieldErrors={fieldErrors}
              listingType={base.listingType}
            />
          )}
        </>
      )}

      {showLandFlow && landFlowData.propertyType && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Land Details
          </p>

          <div className="flex flex-wrap gap-3">
            {landSubTypes.map((subType: string) => {
              const isSelected = landFlowData.landSubType === subType;

              return (
                <button
                  key={subType}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: landFlowPropertyType,
                        key: "landSubType",
                        value: subType,
                      }),
                    )
                  }
                  className={`px-4 py-2 rounded-md border text-sm transition
              ${isSelected
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {subType.replace(/-/g, " ").toUpperCase()}
                </button>
              );
            })}
          </div>

          {showErrors && fieldErrors.landSubType?.[0] && (
            <p className="text-xs text-red-500 mt-2">
              {fieldErrors.landSubType[0]}
            </p>
          )}
        </div>
      )}
      {showLandFlow && landFlowData.landSubType && (
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
              value={landFlowData.dimensions?.length ?? ""}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: landFlowPropertyType,
                    key: "dimensions",
                    value: {
                      length: value,
                      width: landFlowData.dimensions?.width || "",
                    },
                  }),
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
              value={landFlowData.dimensions?.width ?? ""}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: landFlowPropertyType,
                    key: "dimensions",
                    value: {
                      length: landFlowData.dimensions?.length || "",
                      width: value,
                    },
                  }),
                )
              }
            />
          </div>

          {showErrors && fieldErrors.dimensions?.[0] && (
            <p className="text-xs text-red-500 mt-2">
              {fieldErrors.dimensions[0]}
            </p>
          )}
        </div>
      )}

      {agriculturalSubTypes.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Agricultural Land Characteristics
          </p>
          <div className="flex flex-wrap gap-3">
            {agriculturalSubTypes.map((subType: string) => {
              const isSelected =
                (agricultural as any).agriculturalSubType === subType;
              return (
                <button
                  key={subType}
                  type="button"
                  onClick={() => {
                    dispatch(
                      setProfileField({
                        propertyType: "agricultural",
                        key: "agriculturalSubType",
                        value: subType,
                      }),
                    );
                  }}
                  className={`px-4 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-colors ${isSelected
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-gray-300 text-gray-700"
                    }`}
                >
                  {subType.replace(/-/g, " ").toUpperCase()}
                </button>
              );
            })}
          </div>
          {showErrors && fieldErrors.agriculturalSubType?.[0] && (
            <p className="text-xs text-red-500 mt-2">
              {fieldErrors.agriculturalSubType[0]}
            </p>
          )}
        </div>
      )}
      {((propertyType === "residential" && showPricing) ||
        (isProjectResidentialFlow && showPricing)) && (
        <PricingDetails
          propertyType={residentialFlowPropertyType}
          data={residentialFlowData}
          fieldErrors={fieldErrors}
          listingType={base.listingType}
        />
      )}
      {showLandFlow && landFlowData.landSubType && (
        <PricingDetails
          propertyType={landFlowPropertyType}
          data={landFlowData}
          fieldErrors={fieldErrors}
          listingType={base.listingType}
        />
      )}

      {propertyType === "agricultural" && agricultural.agriculturalSubType && (
        <PricingDetails
          propertyType="agricultural"
          data={agricultural}
          fieldErrors={fieldErrors}
          listingType={base.listingType}
        />
      )}

      {isLoggedIn &&
        propertyType !== null &&
        (["residential", "commercial", "land"].includes(propertyType) ||
          isProjectResidentialFlow ||
          isProjectLandFlow) && (
          <div className="space-y-6">
            {!showLandFlow && (
              <>
                {/* Availability Status */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Availability Status
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: "Ready to Move", value: "ready-to-move" },
                      {
                        label: "Under Construction",
                        value: "under-construction",
                      },
                    ].map((item) => {
                      const active = profileData.constructionStatus === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            dispatch(
                              setProfileField({
                                propertyType,
                                key: "constructionStatus",
                                value: item.value,
                              }),
                            );

                            if (
                              (propertyType === "residential" ||
                                isProjectResidentialFlow) &&
                              item.value !== "ready-to-move"
                            ) {
                              dispatch(
                                setProfileField({
                                  propertyType,
                                  key: "propertyAge",
                                  value: undefined,
                                }),
                              );
                            }
                          }}
                          className={`px-6 py-2 rounded-md text-sm border transition
                ${active
                              ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  {showErrors && fieldErrors.constructionStatus?.[0] && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.constructionStatus[0]}
                    </p>
                  )}
                </div>

                {/* Property Age / Possession */}
                {profileData.constructionStatus === "ready-to-move" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Property Age
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: "0-1-year", label: "0-1 Year" },
                        { value: "1-5-years", label: "1-5 Years" },
                        { value: "5-10-years", label: "5-10 Years" },
                        { value: "10-plus-years", label: "10+ Years" },
                      ].map((item) => {
                        const active = profileData.propertyAge === item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() =>
                              dispatch(
                                setProfileField({
                                  propertyType,
                                  key: "propertyAge",
                                  value: item.value,
                                }),
                              )
                            }
                            className={`px-6 py-2 rounded-md text-sm border transition
                  ${active
                                ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {profileData.constructionStatus === "under-construction" && (
                  <InputField
                    label="Expected Possession Date"
                    type="date"
                    value={profileData.possessionDate || ""}
                    onChange={(value) =>
                      dispatch(
                        setProfileField({
                          propertyType,
                          key: "possessionDate",
                          value,
                        }),
                      )
                    }
                  />
                )}
              </>
            )}

            {/* Transaction Type */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-gray-700">
                  Sale Type
                </p>

                <div className="relative group">
                  <InfoIcon size={16} color="#9CA3AF" />

                  <div className="absolute left-1/2 bottom-full z-50 mb-2 min-w-[205px] max-w-[320px] -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 invisible transition-all duration-200 whitespace-normal wrap-break-word group-hover:opacity-100 group-hover:visible">
                    Choose "New Sale" for a newly built property being sold for
                    the first time, or "Resale" for a previously owned property.

                    <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { label: "New Sale", value: "new-sale" },
                  { label: "Resale", value: "resale" },
                ].map((item) => {
                  const active = profileData.transactionType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        dispatch(
                          setProfileField({
                            propertyType,
                            key: "transactionType",
                            value: item.value,
                          }),
                        )
                      }
                      className={`px-6 py-2 rounded-md text-sm border transition
                ${active
                          ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {showErrors && fieldErrors.transactionType?.[0] && (
                <p className="text-xs text-red-500 mt-1">
                  {fieldErrors.transactionType[0]}
                </p>
              )}
            </div>
          </div>
        )}

      {/* Contact Details – Logged Out UI */}
      {!isLoggedIn && (
        <>
          <div
            onClick={() => setShowLoginDialog(true)}
            className="cursor-pointer"
          >
            {/* Label */}
            <label className="mb-2 block text-sm font-semibold text-[#0F172A]">
              {contactLabel}
            </label>

            {/* Fake Input */}
            <div className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 transition hover:border-[#27AE60] focus-within:ring-2 focus-within:ring-[#27AE60]/20">
              Phone Number
            </div>
            <div className="text-sm">
              <p className="text-gray-700">
                Are you a registered user?{" "}
                <span
                  className="font-medium text-[#27AE60] hover:underline cursor-pointer"
                  onClick={() => setShowLoginDialog(true)}
                >
                  Login
                </span>
              </p>
            </div>
          </div>

          <div className="z-50">
            {showLoginDialog && (
              <LoginDialog
                open={showLoginDialog}
                onClose={() => setShowLoginDialog(false)}
                onSwitchToRegister={() => {
                  setShowLoginDialog(false);
                  setShowRegisterDialog(true);
                }}
              />
            )}

            {showRegisterDialog && (
              <RegisterDialog
                open={showRegisterDialog}
                onClose={() => setShowRegisterDialog(false)}
                onSwitchToLogin={() => {
                  setShowRegisterDialog(false);
                  setShowLoginDialog(true);
                }}
              />
            )}
          </div>
        </>
      )}

      <br />

      <button
        onClick={async () => {
          setShowErrors(true);

          if (!isFormValid) {
            console.error("❌ Validation failed");
            console.table(validationResult.error?.flatten().fieldErrors);
            return;
          }

          const profileData =
            propertyType === "residential"
              ? residential
              : propertyType === "commercial"
                ? commercial
                : propertyType === "land"
                  ? land
                  : propertyType === "agricultural"
                    ? agricultural
                    : project;

          const basicPayload: Record<string, any> = {
            ...base,
            ...profileData,
          };
          const submitCategory =
            propertyType === "project"
              ? getProjectBackendCategory(project.propertyType)
              : propertyType;

          if (propertyType === "project") {
            basicPayload.propertyType = normalizeProjectPropertyTypeForBackend(
              project.propertyType,
            );
          }

          if (
            (submitCategory === "land" || propertyType === "agricultural") &&
            base.landName
          ) {
            basicPayload.landName = base.landName;
          }

          if (propertyType === "commercial" && profileData.commercialSubType) {
            basicPayload.propertySubType = profileData.commercialSubType;
            delete basicPayload.commercialSubType;
          }

          if (submitCategory === "land" && profileData.landSubType) {
            basicPayload.propertySubType =
              profileData.landSubType === "corner-plot"
                ? "corner"
                : profileData.landSubType;
            delete basicPayload.landSubType;

            // Backward compatibility: older UI/state used `roadWidth` for land.
            if (!basicPayload.roadWidthFt && basicPayload.roadWidth) {
              basicPayload.roadWidthFt = basicPayload.roadWidth;
            }
            delete basicPayload.roadWidth;
          }

          if (
            propertyType === "agricultural" &&
            profileData.agriculturalSubType
          ) {
            basicPayload.propertySubType = profileData.agriculturalSubType;
            delete basicPayload.agriculturalSubType;
          }

          let activeDraftId = draftId;

          if (!activeDraftId) {
            try {
              const draftResponse = await createDraftApi(submitCategory);
              activeDraftId = draftResponse?.data?._id;

              if (activeDraftId) {
                dispatch(setDraftId(activeDraftId));
              }
            } catch (err) {
              console.error("Draft creation failed", err);
              return;
            }
          }

          if (!activeDraftId) {
            console.error("Draft id missing");
            return;
          }

          dispatch(
            submitBasicThunk({
              category: submitCategory,
              id: activeDraftId,
              data: {
                ...basicPayload,
              },
            }),
          )
            .unwrap()
            .then(() => {
              dispatch(nextStep());
            })
            .catch((err) => {
              console.error("Basic step failed", err);
            });
        }}
        className="px-4 py-2 btn-primary cursor-pointer text-white rounded disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
