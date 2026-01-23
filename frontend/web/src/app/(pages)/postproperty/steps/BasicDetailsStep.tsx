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

export default function BasicDetailsStep() {
  const {
    propertyType,
    base,
    residential,
    commercial,
    land,
    agricultural,
    draftId,
  } = useSelector((state: any) => state.postProperty);
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
  const [showFurnishingFacing, setShowFurnishingFacing] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (propertyType === "residential") {
      if (residential.propertyType) setShowRoomDetails(true);
      if (
        (residential.bedrooms && residential.bedrooms > 1) ||
        (residential.bathrooms && residential.bathrooms > 1) ||
        (residential.balconies && residential.balconies > 0) ||
        residential.furnishing ||
        residential.facing
      ) {
        setShowFurnishingFacing(true);
      }
      if (residential.facing) setShowPricing(true);
    } else {
      // Reset when switching away from residential
      setShowRoomDetails(false);
      setShowFurnishingFacing(false);
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

  const validationResult = validateBasicDetails(
    {
      ...base,
      propertyType: categoryState?.propertyType || base.propertyType,
      price: residential.price,
      carpetArea: residential.carpetArea,
      builtUpArea: residential.builtUpArea,
      constructionStatus: residential.constructionStatus,
      transactionType: residential.transactionType,
      bedrooms: residential.bedrooms,
      bathrooms: residential.bathrooms,
      balconies: residential.balconies,
      furnishing: residential.furnishing,
      facing: residential.facing,
      propertyAge: residential.propertyAge,
      possessionDate: residential.possessionDate,
    },
    propertyType,
  );

  const isFormValid = validationResult.success;

  const fieldErrors =
    showErrors && !validationResult.success
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

  useEffect(() => {
    const price =
      Number(residential.price) || Number(residential.expectedPrice);
    const area = Number(residential.carpetArea);

    if (price > 0 && area > 0) {
      const pricePerSqft = String(Math.round(price / area));
      if (pricePerSqft !== residential.pricePerSqft) {
        dispatch(
          setProfileField({
            propertyType: "residential",
            key: "pricePerSqft",
            value: pricePerSqft,
          }),
        );
      }
    } else {
      if (residential.pricePerSqft) {
        dispatch(
          setProfileField({
            propertyType: "residential",
            key: "pricePerSqft",
            value: "",
          }),
        );
      }
    }
  }, [
    residential.price,
    residential.expectedPrice,
    residential.carpetArea,
    residential.pricePerSqft,
    dispatch,
  ]);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">Listing type</p>

      <div className="flex gap-3">
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

      <div className="mb-2 flex items-center gap-6">
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
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-4">
                  <CounterField
                    label="Bedrooms"
                    value={residential.bedrooms || residential.bhk || 1}
                    min={1}
                    onChange={(value) => {
                      dispatch(
                        setProfileField({
                          propertyType: "residential",
                          key: "bedrooms",
                          value,
                        }),
                      );
                      setShowFurnishingFacing(true);
                    }}
                    error={fieldErrors.bedrooms?.[0]}
                  />

                  <CounterField
                    label="Bathrooms"
                    value={residential.bathrooms || 1}
                    min={1}
                    onChange={(value) => {
                      dispatch(
                        setProfileField({
                          propertyType: "residential",
                          key: "bathrooms",
                          value,
                        }),
                      );
                      setShowFurnishingFacing(true);
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
                      setShowFurnishingFacing(true);
                    }}
                  />
                </div>

                {showFurnishingFacing && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_145px] items-start">
                    {/* Furnishing */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Furnishing
                      </p>

                      <div className="flex gap-3 flex-wrap">
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
                    </div>
                    {showErrors && fieldErrors.furnishing?.[0] && (
                      <p className="text-xs text-red-500">
                        {fieldErrors.furnishing[0]}
                      </p>
                    )}

                    {/* Facing */}
                    <Dropdownui
                      label="Facing"
                      value={residential.facing || null}
                      onChange={(value) => {
                        dispatch(
                          setProfileField({
                            propertyType: "residential",
                            key: "facing",
                            value,
                          }),
                        );
                        setShowPricing(true);
                      }}
                      options={FACING_TYPES.map((t) => ({
                        value: t,
                        label: t,
                      }))}
                      placeholder="Select"
                      error={fieldErrors.facing?.[0]}
                    />
                  </div>
                )}
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
          {(commercial.cabins > 0 || commercial.seats > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_145px] gap-1 items-start">
              {/* Furnishing */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Furnishing</p>

                <div className="flex gap-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {/* Total Price */}
              <div className="flex flex-col">
                <InputField
                  label="Total Price"
                  value={residential.price || ""}
                  placeholder="e.g. 75,00,000"
                  error={fieldErrors.price?.[0]}
                  onChange={(value) =>
                    dispatch(
                      setProfileField({
                        propertyType: "residential",
                        key: "price",
                        value: value.replace(/\D/g, ""),
                      }),
                    )
                  }
                />

                {/* Price in words */}
                {commercial.price && (
                  <p className="mt-1 text-xs text-gray-500 italic">
                    ₹ {numberToWords(Number(commercial.price))}
                    {commercial.pricePerSqft && (
                      <>
                        {" "}
                        (₹ {commercial.pricePerSqft.toLocaleString()} per
                        sq.ft.)
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Carpet Area */}
              <InputField
                label="Carpet Area (sq ft)"
                value={commercial.carpetArea || ""}
                placeholder="e.g. 1200"
                error={fieldErrors.carpetArea?.[0]}
                onChange={(value) =>
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "carpetArea",
                      value: value.replace(/\D/g, ""),
                    }),
                  )
                }
              />
              {/* Price / sq ft */}
              <div className="flex flex-col">
                <InputField
                  label="Price / sq ft"
                  value={commercial.pricePerSqft || ""}
                  placeholder="Auto calculated"
                  disabled
                  onChange={() => {}}
                />

                <button
                  type="button"
                  onClick={() => dispatch(setStep(1))}
                  className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 self-start"
                >
                  Based on
                  <span className="font-medium underline">Carpet Area</span>
                  <span className="text-[10px]">▼</span>
                </button>
              </div>

              {/* Built-up Area */}
              <InputField
                label="Built-up Area (sq ft)"
                value={commercial.builtUpArea || ""}
                placeholder="Optional"
                error={fieldErrors.builtUpArea?.[0]}
                onChange={(value) =>
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "builtUpArea",
                      value: value.replace(/\D/g, ""),
                    }),
                  )
                }
              />
            </div>
          )}
        </>
      )}

      {landSubTypes.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Land Characteristics
          </p>
          <div className="flex flex-wrap gap-3">
            {landSubTypes.map((subType: string) => {
              const isSelected = (land as any).landSubType === subType;
              return (
                <button
                  key={subType}
                  type="button"
                  onClick={() => {
                    dispatch(
                      setProfileField({
                        propertyType: "land",
                        key: "landSubType",
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
        </div>
      )}
      {propertyType === "residential" && showPricing && (
        <div className="space-y-3">
          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* Total Price */}
            <div className="flex flex-col">
              <InputField
                label="Total Price"
                value={residential.price || ""}
                placeholder="e.g. 75,00,000"
                error={fieldErrors.price?.[0]}
                onChange={(value) =>
                  dispatch(
                    setProfileField({
                      propertyType: "residential",
                      key: "price",
                      value: value.replace(/\D/g, ""),
                    }),
                  )
                }
              />

              {/* Price in words */}
              {residential.price && (
                <p className="mt-1 text-xs text-gray-500 italic">
                  ₹ {numberToWords(Number(residential.price))}
                  {residential.pricePerSqft && (
                    <>
                      {" "}
                      (₹ {residential.pricePerSqft.toLocaleString()} per sq.ft.)
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Carpet Area */}
            <InputField
              label="Carpet Area (sq ft)"
              value={residential.carpetArea || ""}
              placeholder="e.g. 1200"
              error={fieldErrors.carpetArea?.[0]}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "carpetArea",
                    value: value.replace(/\D/g, ""),
                  }),
                )
              }
            />
            {/* Price / sq ft */}
            <div className="flex flex-col">
              <InputField
                label="Price / sq ft"
                value={residential.pricePerSqft || ""}
                placeholder="Auto calculated"
                disabled
                onChange={() => {}}
              />

              <button
                type="button"
                onClick={() => dispatch(setStep(1))}
                className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 self-start"
              >
                Based on
                <span className="font-medium underline">Carpet Area</span>
                <span className="text-[10px]">▼</span>
              </button>
            </div>

            {/* Built-up Area */}
            <InputField
              label="Built-up Area (sq ft)"
              value={residential.builtUpArea || ""}
              placeholder="Optional"
              error={fieldErrors.builtUpArea?.[0]}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "builtUpArea",
                    value: value.replace(/\D/g, ""),
                  }),
                )
              }
            />
          </div>
        </div>
      )}

      {isLoggedIn && (
        <div className="space-y-6">
          {/* Availability Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Availability Status
            </p>

            <div className="flex gap-5">
              {[
                { label: "Ready to Move", value: "ready-to-move" },
                { label: "Under Construction", value: "under-construction" },
              ].map((item) => {
                const active = residential.constructionStatus === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      dispatch(
                        setProfileField({
                          propertyType: "residential",
                          key: "constructionStatus",
                          value: item.value,
                        }),
                      );

                      if (item.value !== "ready-to-move") {
                        dispatch(
                          setProfileField({
                            propertyType: "residential",
                            key: "propertyAge",
                            value: "",
                          }),
                        );
                      }
                    }}
                    className={`px-6 py-2 rounded-md text-sm border transition
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

            {/* ✅ ERROR */}
            {showErrors && fieldErrors.constructionStatus?.[0] && (
              <p className="text-xs text-red-500 mt-1">
                {fieldErrors.constructionStatus[0]}
              </p>
            )}
          </div>

          {residential.constructionStatus === "ready-to-move" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Property Age</p>

              <div className="flex flex-wrap gap-3">
                {[
                  { value: "0-1-year", label: "0-1 Year" },
                  { value: "1-5-years", label: "1-5 Years" },
                  { value: "5-10-years", label: "5-10 Years" },
                  { value: "10-plus-years", label: "10+ Years" },
                ].map((item) => {
                  const active = residential.propertyAge === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        dispatch(
                          setProfileField({
                            propertyType: "residential",
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
              }
            `}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

            <div className="flex gap-5">
              {[
                { label: "New Sale", value: "new-sale" },
                { label: "Resale", value: "resale" },
              ].map((item) => {
                const active = residential.transactionType === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      dispatch(
                        setProfileField({
                          propertyType: "residential",
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
                }
              `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          {showErrors && fieldErrors.transactionType?.[0] && (
            <p className="text-xs text-red-500 mt-1">
              {fieldErrors.transactionType[0]}
            </p>
          )}
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
          console.log("Debbug 1");
          setShowErrors(true);
          console.log("Debbug 2");
          console.log(isFormValid);

          if (!isFormValid || !draftId) {
            console.error("❌ Validation failed");
            console.table(validationResult.error?.flatten().fieldErrors);
            return;
          }
          console.log("Debbug 3");

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
