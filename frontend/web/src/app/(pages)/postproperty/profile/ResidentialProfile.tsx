import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  nextStep,
  setBaseField,
  setProfileField,
} from "@/Redux/slice/postPropertySlice";
import Dropdownui from "@/ui/DropDownUI";
import CounterField from "@/ui/CounterField";
import AmenitiesSelect from "./AmenitiesSelect";
import { RESIDENTIAL_AMENITIES } from "../constants/amenities";
import TextArea from "@/ui/TextArae";
import { useAppDispatch } from "@/Redux/store";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";
import { submitDetailsThunk } from "@/Redux/thunks/submitPropertyApi";
import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { validateResidentialProfile } from "@/zod/profileZods/residentialProfileZod";
import { setFileStoreFiles } from "@/utilies/fileStore";
import { deleteGalleryImageApi } from "@/Redux/apis";

export const FLOORING_TYPES = [
  "vitrified",
  "marble",
  "granite",
  "wooden",
  "ceramic-tiles",
  "mosaic",
  "normal-tiles",
  "cement",
  "other",
] as const;

export const KITCHEN_TYPES = [
  "open",
  "closed",
  "semi-open",
  "island",
  "parallel",
  "u-shaped",
  "l-shaped",
] as const;

export const FACING_TYPES = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"] as const;

export const ParkingTypes = ["open", "closed", "both"] as const;

const ResidentialProfile = () => {
  const { residential, draftId, propertyType } = useSelector(
    (state: any) => state.postProperty,
  );
  const dispatch = useAppDispatch();
  const [showErrors, setShowErrors] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!residential.gallery || residential.gallery.length === 0) return;
    if (files.length > 0) return; // 🔒 don’t overwrite user uploads

    const serverFiles: UploadedFile[] = residential.gallery.map((img: any) => ({
      preview: img.url, // 👈 VERY IMPORTANT
      source: "server",
      name: img.filename,
    }));

    setFiles(serverFiles);
  }, [residential.gallery]);

  const syncFiles = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);

    const serverGallery = newFiles
      .filter((f) => f.source === "server")
      .map((f, index) => ({
        url: f.preview,
        filename: f.name ?? "",
        category: "image",
        order: index + 1,
      }));

    dispatch(
      setBaseField({
        key: "galleryFiles",
        value: newFiles.map((f) => ({
          name: f.name ?? f.file?.name ?? "",
          source: f.source,
          preview: f.preview,
        })),
      }),
    );

    dispatch(
      setProfileField({
        propertyType: "residential",
        key: "gallery",
        value: serverGallery,
      }),
    );

    const localFiles = newFiles
      .filter((f) => f.source === "local")
      .map((f) => f.file)
      .filter((file): file is File => Boolean(file));

    setFileStoreFiles("postProperty", localFiles);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ========== CONFIGURATION ========== */}
      <div className="space-y-6"></div>

      <div>
        <AmenitiesSelect
          label="Amenities"
          options={RESIDENTIAL_AMENITIES}
          value={residential.amenities || []}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "amenities",
                value,
              }),
            )
          }
        />
        {fieldErrors?.amenities?.[0] && (
          <p className="text-red-500 text-xs mt-1">
            {fieldErrors.amenities[0]}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {/* Section Title */}
        <p className="text-sm font-medium text-gray-800">Parking Details</p>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Parking Type */}
          <div>
            <Dropdownui
              label="Parking Type"
              value={residential.parkingType ?? null}
              onChange={(value: string) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "parkingType",
                    value, // "open" | "covered"
                  }),
                )
              }
              options={ParkingTypes.map((t) => ({
                value: t, // "open"
                label: t, // "OPEN"
              }))}
              placeholder="Select"
            />

            {fieldErrors?.parkingType?.[0] && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.parkingType[0]}
              </p>
            )}
          </div>

          {/* Two Wheeler */}
          <div>
            <CounterField
              label="Two-Wheeler Parking"
              value={residential.parkingDetails?.twoWheeler || 0}
              min={0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "parkingDetails",
                    value: {
                      ...residential.parkingDetails,
                      twoWheeler: value,
                    },
                  }),
                )
              }
            />
            {fieldErrors?.parkingDetails?.[0] && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.parkingDetails[0]}
              </p>
            )}
          </div>

          {/* Four Wheeler */}
          <div>
            <CounterField
              label="Four-Wheeler Parking"
              value={residential.parkingDetails?.fourWheeler || 0}
              min={0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "parkingDetails",
                    value: {
                      ...residential.parkingDetails,
                      fourWheeler: value,
                    },
                  }),
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Section Title */}
        <p className="text-sm font-medium text-gray-800">Floor Details</p>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {/* Flooring Type */}
          <div>
            <Dropdownui
              label="Flooring Type"
              value={residential.flooringType || null}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "flooringType",
                    value,
                  }),
                )
              }
              options={FLOORING_TYPES.map((t) => ({
                value: t,
                label: t.replace("-", " "),
              }))}
              placeholder="Select"
            />
            {fieldErrors?.flooringType?.[0] && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.flooringType[0]}
              </p>
            )}
          </div>

          {/* Floor Number */}
          <div>
            <CounterField
              label="Floor Number"
              min={0}
              tooltip="0 means ground floor."
              value={residential.floorNumber ?? 0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "floorNumber",
                    value,
                  }),
                )
              }
            />
            {fieldErrors?.floorNumber?.[0] && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.floorNumber[0]}
              </p>
            )}
          </div>

          {/* Total Floors */}
          <div>
            <CounterField
              label="Total Floors"
              min={0}
              tooltip="Use 0 only when the building has a ground floor and no upper floors."
              value={residential.totalFloors ?? 0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "totalFloors",
                    value,
                  }),
                )
              }
            />
            {fieldErrors?.totalFloors?.[0] && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.totalFloors[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-end">
        <div>
          <Dropdownui
            label="Kitchen Type"
            value={residential.kitchenType || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "kitchenType",
                  value,
                }),
              )
            }
            options={KITCHEN_TYPES.map((t) => ({
              value: t,
              label: t.replace("-", " "),
            }))}
            placeholder="Select"
          />
          {fieldErrors?.kitchenType?.[0] && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.kitchenType[0]}
            </p>
          )}
        </div>

        {/* Modular Kitchen */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Modular Kitchen
          </label>

          <div
            className="flex py-2 items-center justify-between rounded-lg border
               border-gray-300 bg-white px-4
               shadow-sm transition
               hover:border-gray-400 mt-2"
          >
            <span className="text-sm text-gray-700">Available</span>

            <input
              type="checkbox"
              checked={residential.isModularKitchen || false}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "isModularKitchen",
                    value: e.target.checked,
                  }),
                )
              }
              className="h-5 w-5 accent-green-600 cursor-pointer"
            />
          </div>
          {fieldErrors?.isModularKitchen?.[0] && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.isModularKitchen[0]}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <FileUpload
          label="Property Images"
          value={files}
          onChange={syncFiles}
          onRemove={async (removedItem, removedIndex, currentFiles) => {
            if (removedItem.source !== "server") return true;

            if (!draftId) {
              toast.error("Draft not found. Please refresh and try again.");
              return false;
            }

            const serverIndex =
              currentFiles
                .slice(0, removedIndex + 1)
                .filter((f) => f.source === "server").length - 1;

            if (serverIndex < 0) {
              toast.error("Invalid image index.");
              return false;
            }

            try {
              await deleteGalleryImageApi("residential", draftId, serverIndex);
              toast.success("Image removed");
              return true;
            } catch (err: any) {
              const message =
                err?.message ||
                err?.response?.data?.message ||
                "Failed to delete image from server";
              toast.error(message);
              return false;
            }
          }}
          accept="image/*"
          maxFiles={5}
          maxSizeMB={5}
          error={fieldErrors?.images?.[0]}
        />
      </div>

      <div
        className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 ${
          residential.isPriceNegotiable
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
              residential.isPriceNegotiable ? "text-green-600" : "text-gray-400"
            }`}
          >
            {residential.isPriceNegotiable ? "YES" : "NO"}
          </span>
          <Toggle
            enabled={residential.isPriceNegotiable || false}
            onChange={(val) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "isPriceNegotiable",
                  value: val,
                }),
              )
            }
          />
        </div>
      </div>

      <TextArea
        label="Property Description"
        value={residential.description || ""}
        placeholder="e.g. Spacious 3 BHK apartment with east-facing balcony, covered parking, power backup, and close to IT parks."
        maxLength={500}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType: "residential",
              key: "description",
              value,
            }),
          )
        }
      />
      {fieldErrors?.description?.[0] && (
        <p className="text-red-500 text-xs mt-1">
          {fieldErrors.description[0]}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setShowErrors(true);

          // ✅ Prepare payload for validation
          const payload = {
            ...residential,
            amenities: Array.isArray(residential.amenities)
              ? residential.amenities.map((a: any) => a?.title).filter(Boolean)
              : [],
          };

          // 🖼️ IMAGE COUNT LOGIC (FIX)
          const serverImageCount = files.filter(
            (f) => f.source === "server",
          ).length;

          const localFiles: File[] = files
            .filter((f) => f.source === "local" && f.file)
            .map((f) => f.file as File);

          const totalImageCount = serverImageCount + localFiles.length;

          // ❌ Not enough images
          if (totalImageCount < 5) {
            setFieldErrors({
              images: ["Upload at least 5 images"],
            });
            toast.error("Upload at least 5 images");
            return;
          }

          // ✅ Zod validation (non-image fields)
          const result = validateResidentialProfile(payload, localFiles);

          if (!result.success) {
            const errors = result.error.flatten().fieldErrors;

            console.error("❌ Residential Profile Validation Failed");
            console.table(errors);

            setFieldErrors(errors);
            toast.error("Please fix the highlighted errors");
            return;
          }

          setFieldErrors({});

          // 🚀 Submit to backend
          dispatch(
            submitDetailsThunk({
              category: propertyType,
              id: draftId,
              payload: residential,
            }),
          )
            .unwrap()
            .then(() => {
              dispatch(nextStep());
            })
            .catch((error: any) => {
              const errObj =
                typeof error === "string"
                  ? { message: error }
                  : error?.response?.data || error;

              toast.error(errObj?.message || "Failed to submit property");
            });
        }}
        className="py-2 btn-primary text-white rounded-md cursor-pointer w-full"
      >
        Continue
      </button>
    </div>
  );
};

export default ResidentialProfile;
