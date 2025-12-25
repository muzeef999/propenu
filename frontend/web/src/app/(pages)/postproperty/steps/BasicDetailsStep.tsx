import { useDispatch, useSelector } from "react-redux";
import {
  setPropertyType,
  nextStep,
  setBaseField,
  setProfileField,
} from "@/Redux/slice/postPropertySlice";

import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { setFiles as setFileStoreFiles } from "@/lib/fileStore";
import { useState } from "react";
import { validateBasicDetails } from "@/zod/basicDetailsZod";
import { RESIDENTIAL_PROPERTY_OPTIONS, COMMERCIAL_PROPERTY_OPTIONS } from "@/app/(pages)/postproperty/constants/subTypes";

export default function BasicDetailsStep() {
  const { propertyType, base, residential, commercial, land, agricultural } = useSelector(
    (state: any) => state.postProperty
  );
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const listingOptions = [
    { label: "Sale", value: "sale" },
    { label: "Rent / Lease", value: "rent" },
  ];

  const dispatch = useDispatch();

  // Get the current category state
  const categoryState = propertyType === "residential" ? residential : propertyType === "commercial" ? commercial : propertyType === "land" ? land : agricultural;

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
    files
  );

  const isFormValid = validationResult.success;

  const fieldErrors = showErrors && !validationResult.success
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
      : [];

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">Listing type</p>

      <div className="flex gap-3">
        {listingOptions.map((option) => {
          const isActive = base.listingType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                dispatch(
                  setBaseField({
                    key: "listingType",
                    value: option.value,
                  })
                )
              }
              className={`px-5 py-2 rounded-md border text-sm font-medium transition${isActive? "border-green-200 bg-green-50 text-green-600" : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"}`}
            >
              {option.label}
            </button>
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
              {type}
            </span>
          </label>
        ))}
      </div>

      {subTypes.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">Property Sub-Type</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {subTypes.map((sub) => {
              const isSelected = categoryState?.propertyType === sub.key;
              return (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => {
                    if (propertyType) {
                      dispatch(setProfileField({ propertyType: propertyType as any, key: "propertyType", value: sub.key }))
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-all ${
                    isSelected
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
            })
          );
          // store actual File objects in in-memory file store
          setFileStoreFiles("postProperty", newFiles.map((f) => f.file));
        }}
        accept="image/*"
        maxFiles={5}
        maxSizeMB={5}
        error={fieldErrors?.images?.[0]}
      />

      <br />

      <button
        onClick={() => {
          setShowErrors(true);
          if (isFormValid) {
            console.log("BasicDetailsStep Data:", { base, propertyType, files });
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
