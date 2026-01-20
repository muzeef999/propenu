import { useDispatch, useSelector } from "react-redux";
import {
  setPropertyType,
  nextStep,
  setBaseField,
  setProfileField,
} from "@/Redux/slice/postPropertySlice";
import SelectableButton from "@/ui/SelectableButton";

import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { setFiles as setFileStoreFiles } from "@/lib/fileStore";
import { useState, useEffect } from "react";
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

export default function BasicDetailsStep() {
  const { propertyType, base, residential, commercial, land, agricultural } =
    useSelector((state: any) => state.postProperty);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
  }, []);
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
      title: base.title || "",
      price: base.price || "",
      carpetArea: base.carpetArea || "",
      description: base.description || "",
    },
    propertyType,
    files,
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

  const contactLabel = base.listingType === "sale" ? "Your contact details for buyers to reach you" : "Your contact details for tenants to reach you";


  const landSubTypes =
    propertyType === "land"
      ? (LAND_PROPERTY_SUBTYPES as readonly string[])
      : [];

  const agriculturalSubTypes =
    propertyType === "agricultural"
      ? (AGRICULTURAL_PROPERTY_SUBTYPES as readonly string[])
      : [];

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

      <h2 className="text-sm font-medium  text-gray-700">Property Type</h2>

      <div className="mb-6 flex  items-center gap-6">
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
            <span className="capitalize text-sm font-normak text-gray-700">
              {type === "land" ? "Plot / Land" : type}
            </span>
          </label>
        ))}
      </div>

      {subTypes.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Property Sub-Type
          </p>
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
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-all ${isSelected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  <span className="text-2xl">{sub.icon}</span>
                  <span className="text-xs font-medium">{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {commercialSubTypes.length > 0 && (
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
                  onClick={() => {
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "commercialSubType",
                        value: subType,
                      }),
                    );
                  }}
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
        </div>
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
        </div>
      )}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-800">Price Details</p>

        {/* Changed to grid-cols-4 for desktop, added items-end for alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 items-end">
          <InputField
            label="Carpet Area (sq ft)"
            value={residential.carpetArea || ""}
            placeholder="e.g. 1200"
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

          <InputField
            label="Built-up (sq ft)"
            type="number"
            value={residential.builtUpArea || ""}
            placeholder="Optional"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "builtUpArea",
                  value,
                }),
              )
            }
          />
        </div>
      </div>

      {isLoggedIn && (
        <FileUpload
          label="Property Images"
          value={files}
          onChange={(newFiles) => {
            setFiles(newFiles);
            // persist only metadata in Redux (serializable)
            dispatch(
              setBaseField({
                key: "galleryFiles",
                value: newFiles.map((f) => ({ filename: f.file.name })),
              }),
            );
            // store actual File objects in in-memory file store
            setFileStoreFiles(
              "postProperty",
              newFiles.map((f) => f.file),
            );
          }}
          accept="image/*"
          maxFiles={5}
          maxSizeMB={5}
          error={fieldErrors?.images?.[0]}
        />
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
          if (isFormValid) {
            console.log("BasicDetailsStep Data:", {
              base,
              propertyType,
              files,
            });
            dispatch(nextStep());
          }
        }}
        className="px-4 py-2 btn-primary cursor-pointer text-white rounded disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
