import { useDispatch, useSelector } from "react-redux";
import {
  setPropertyType,
  nextStep,
  setBaseField,
} from "@/Redux/slice/postPropertySlice";
import InputField from "@/ui/InputFiled";
import TextArea from "@/ui/TextArae";
import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { setFiles as setFileStoreFiles } from "@/lib/fileStore";
import { useState } from "react";
import { validateBasicDetails } from "@/zod/basicDetailsZod";

export default function BasicDetailsStep() {
  const { propertyType, base } = useSelector(
    (state: any) => state.postProperty
  );
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const listingOptions = [
    { label: "Sale", value: "sale" },
    { label: "Rent / Lease", value: "rent" },
    { label: "Buy", value: "buy" },
  ];

  const dispatch = useDispatch();

  const validationResult = validateBasicDetails(
    {
      ...base,
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
              className={`
          px-5 py-2 rounded-full border
          text-sm font-medium transition
          ${
            isActive
              ? "border-green-500 bg-green-50 text-green-600"
              : "border-gray-300 text-gray-600 hover:border-gray-400"
          }
        `}
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

      <InputField
        label="Property Title"
        value={base.title || ""}
        required
        placeholder="e.g. 3 BHK Apartment in Whitefield"
        onChange={(value) => dispatch(setBaseField({ key: "title", value }))}
        error={fieldErrors?.title?.[0]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Total Price"
          value={base.price || ""}
          placeholder="e.g. 75,00,000"
          onChange={(value) =>
            dispatch(setBaseField({ key: "price", value: value.replace(/\D/g, "") }))
          }
          error={fieldErrors?.price?.[0]}
        />

        <InputField
          label="Area (sq ft)"
          value={base.carpetArea || ""}
          placeholder="e.g. 1200"
          onChange={(value) => dispatch(setBaseField({ key: "carpetArea", value: value.replace(/\D/g, "") }))}
          error={fieldErrors?.areaSqft?.[0]}
        />

        <InputField
          label="Price / sq ft"
          value={
            base.price && base.carpetArea
              ? Math.round(Number(base.price) / Number(base.carpetArea))
              : ""
          }
          placeholder="Auto calculated"
          disabled
          onChange={() => {}}
        />
      </div>

      <TextArea
        label="Property Description"
        value={base.description || ""}
        placeholder="e.g. Spacious 3 BHK apartment with east-facing balcony, covered parking, power backup, and close to IT parks."
        maxLength={500}
        onChange={(value) =>
          dispatch(setBaseField({ key: "description", value }))
        }
        error={fieldErrors?.description?.[0]}
      />

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
