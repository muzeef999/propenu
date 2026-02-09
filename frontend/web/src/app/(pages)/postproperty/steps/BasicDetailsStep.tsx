import { useDispatch, useSelector } from "react-redux";
import {
  setPropertyType,
  nextStep,
  setBaseField,
  setProfileField,
  setStep,
} from "@/Redux/slice/postPropertySlice";
import SelectableButton from "@/ui/SelectableButton";

import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { useEffect, useState } from "react";
import { validateBasicDetails } from "@/zod/basicDetailsZod";
import Cookies from "js-cookie";
import {
  RESIDENTIAL_PROPERTY_OPTIONS,
  COMMERCIAL_PROPERTY_OPTIONS,
  COMMERCIAL_SUBTYPE_MAP,
  LAND_PROPERTY_OPTIONS,
  LAND_PROPERTY_SUBTYPES,
  AGRICULTURAL_PROPERTY_OPTIONS,
  AGRICULTURAL_PROPERTY_SUBTYPES,
} from "@/app/(pages)/postproperty/constants/subTypes";
import InputField from "@/ui/InputField";
import LoginDialog from "@/app/(auth)/Login";
import { submitBasicThunk } from "@/Redux/thunks/submitPropertyApi";
import { AppDispatch } from "@/Redux/store";
import CounterField from "@/ui/CounterField";
import Dropdownui from "@/ui/DropDownUI";
import { FACING_TYPES } from "../profile/ResidentialProfile";
import { numberToWords } from "@/utilies/NumberToWord";
import { property } from "zod";
import PricingDetails from "../components/PricingDetails";

import { useAppDispatch, useAppSelector } from "@/Redux/store";

export default function BasicDetailsStep() {
  const {
    propertyType,
    base,
    residential,
    commercial,
    land,
    agricultural,
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
  // const dispatch = useDispatch<AppDispatch>();

  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (!propertyType) {
      dispatch(setPropertyType("residential"));
    }
  }, [propertyType, dispatch]);

  useEffect(() => {
    if (propertyType === "residential") {
      if (residential.propertyType) setShowRoomDetails(true);
      if (residential.facing) setShowPricing(true);
    } else {
      // Reset when switching away from residential
      setShowRoomDetails(false);
      setShowPricing(false);
    }
  }, [propertyType, residential]);

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
          : agricultural;

  const profileData =
    propertyType === "residential"
      ? residential
      : propertyType === "commercial"
        ? commercial
        : propertyType === "land"
          ? land
          : agricultural;

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
    propertyType === "land"
      ? (LAND_PROPERTY_SUBTYPES as readonly string[])
      : [];

  const agriculturalSubTypes =
    propertyType === "agricultural"
      ? (AGRICULTURAL_PROPERTY_SUBTYPES as readonly string[])
      : [];

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
        {["residential", "commercial", "land", "agricultural"].map((type) => (
          <label
            key={type}
            className="flex items-center justify-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name="propertyType"
              className="scale-125"
              checked={propertyType === type}
              onChange={() => handleSelect(type)}
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
                          if (propertyType === "residential") {
                            setShowRoomDetails(true);
                          }
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-all
            ${
              isSelected
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }
          `}
                    >
                      <span className="text-2xl">{sub.icon}</span>
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

            {/* RESIDENTIAL DETAILS */}
            {propertyType === "residential" && showRoomDetails && (
              <div className="space-y-6">
                {/* Counters */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  <CounterField
                    label="Bedrooms"
                    value={residential.bedrooms || 0}
                    min={1}
                    onChange={(value) => {
                      dispatch(
                        setProfileField({
                          propertyType: "residential",
                          key: "bedrooms",
                          value,
                        }),
                      );
                    }}
                    error={fieldErrors.bedrooms?.[0]}
                  />

                  <CounterField
                    label="Bathrooms"
                    value={residential.bathrooms || 0}
                    min={1}
                    onChange={(value) => {
                      dispatch(
                        setProfileField({
                          propertyType: "residential",
                          key: "bathrooms",
                          value,
                        }),
                      );
                    }}
                    error={fieldErrors.bathrooms?.[0]}
                  />

                  <CounterField
                    label="Balconies"
                    value={residential.balconies || 0}
                    min={0}
                    onChange={(value) => {
                      dispatch(
                        setProfileField({
                          propertyType: "residential",
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
                        { label: "Semi furnished", value: "semi-furnished" },
                        { label: "Un-furnished", value: "unfurnished" },
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
                                }),
                              )
                            }
                            className={`px-5 py-2 rounded-md text-sm border transition
                  ${
                    active
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
  value={residential.facing ?? null}
  onChange={(value: string) => {
    dispatch(
      setProfileField({
        propertyType: "residential",
        key: "facing",
        value, // "North" | "South" | ...
      })
    );
    setShowPricing(true);
  }}
  options={FACING_TYPES.map((dir) => ({
    label: dir, // UI text
    value: dir, // stored value
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
                    className={`px-4 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-colors ${
                      isSelected
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

          {/* Furnishing & Wall Finish - Show only if Cabins or Seats has a value */}
          {(commercial.cabins > 0 ||
            commercial.seats > 0 ||
            (showErrors && fieldErrors.wallFinishStatus)) && (
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_145px] gap-1 items-start">
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
                      active={commercial.furnishing === item.value}
                      onClick={() =>
                        dispatch(
                          setProfileField({
                            propertyType: "commercial",
                            key: "furnishing",
                            value: item.value,
                          }),
                        )
                      }
                    />
                  ))}
                </div>
              </div>

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
            />
          )}
        </>
      )}

      {propertyType === "land" && land.propertyType && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Land Characteristics
          </p>

          <div className="flex flex-wrap gap-3">
            {landSubTypes.map((subType: string) => {
              const isSelected = land.landSubType === subType;

              return (
                <button
                  key={subType}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "land",
                        key: "landSubType",
                        value: subType,
                      }),
                    )
                  }
                  className={`px-4 py-2 rounded-md border text-sm transition
              ${
                isSelected
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
      {propertyType === "land" && land.landSubType && (
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
                  className={`px-4 py-2 border rounded-md text-sm shadow-sm focus:outline-none transition-colors ${
                    isSelected
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
      {propertyType === "residential" && showPricing && (
        <PricingDetails
          propertyType="residential"
          data={residential}
          fieldErrors={fieldErrors}
        />
      )}
      {propertyType === "land" && land.landSubType && (
        <PricingDetails
          propertyType="land"
          data={land}
          fieldErrors={fieldErrors}
        />
      )}

      {propertyType === "agricultural" && agricultural.agriculturalSubType && (
        <PricingDetails
          propertyType="agricultural"
          data={agricultural}
          fieldErrors={fieldErrors}
        />
      )}

      {isLoggedIn &&
        propertyType !== null &&
        ["residential", "commercial"].includes(propertyType) && (
          <div className="space-y-6">
            {/* Availability Status */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Availability Status
              </p>

              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Ready to Move", value: "ready-to-move" },
                  { label: "Under Construction", value: "under-construction" },
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
                          propertyType === "residential" &&
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
                ${
                  active
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
                  ${
                    active
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

            {/* Transaction Type */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Transaction Type
              </p>

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
                ${
                  active
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
                }}
              />
            )}
          </div>
        </>
      )}

      <br />

      <button
        onClick={() => {
          setShowErrors(true);

          if (!isFormValid || !draftId) {
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
                  : agricultural;

          dispatch(
            submitBasicThunk({
              category: propertyType,
              id: draftId,
              data: {
                ...base,
                ...profileData,
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
