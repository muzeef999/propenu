import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { setBaseField, setProfileField, setStep } from "@/Redux/slice/postPropertySlice";
import Dropdownui from "@/ui/DropDownUI";
import CounterField from "@/ui/CounterField";
import InputField from "@/ui/InputField";
import AmenitiesSelect from "./AmenitiesSelect";
import { AMENITIES } from "../constants/amenities";
import TextArea from "@/ui/TextArae";
import { useAppDispatch } from "@/Redux/store";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { submitDetailsThunk } from "@/Redux/thunks/submitPropertyApi";
import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { validateResidentialProfile } from "@/zod/residentialProfileZod";
import { setFileStoreFiles } from "@/utilies/fileStore";

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

export const FACING_TYPES = ["North", "South", "East", "West"] as const;

export const ParkingTypes = ["open", "closed", "both"] as const;

const ResidentialProfile = () => {
  const { residential, draftId, propertyType } = useSelector((state: any) => state.postProperty);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showErrors, setShowErrors] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const validationResult = validateResidentialProfile(
    residential,
    files.map((f) => f.file),
  );

  const fieldErrors =
    showErrors && !validationResult.success
      ? validationResult.error.flatten().fieldErrors
      : {};

  return (
    <div className="space-y-8">
      {/* ========== CONFIGURATION ========== */}
      <div className="space-y-6"></div>

      <div>
        <AmenitiesSelect
          label="Amenities"
          options={AMENITIES}
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
      </div>

      <div className="space-y-3">
        {/* Section Title */}
        <p className="text-sm font-medium text-gray-800">
          Parking Details (Optional)
        </p>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3">
          {/* Parking Type */}
          <Dropdownui
            label="Parking Type"
            value={residential.parkingType || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "parkingType",
                  value,
                }),
              )
            }
            options={ParkingTypes.map((t) => ({
              value: t,
              label: t.toUpperCase(),
            }))}
            placeholder="Select"
          />

          {/* Two Wheeler */}
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

          {/* Four Wheeler */}
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

      <div className="space-y-3">
        {/* Section Title */}
        <p className="text-sm font-medium text-gray-800">Floor Details</p>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3 items-start">
          {/* Flooring Type */}
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
              label: t.replace("-", " ").toUpperCase(),
            }))}
            placeholder="Select"
          />

          {/* Floor Number */}
          <CounterField
            label="Floor Number"
            min={0}
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

          {/* Total Floors */}
          <CounterField
            label="Total Floors"
            min={0}
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 items-end">
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
            label: t.replace("-", " ").toUpperCase(),
          }))}
          placeholder="Select"
        />

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
        </div>
      </div>
      <div className="space-y-2">
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
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
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

      <button
        type="button"
        onClick={() => {
          setShowErrors(true);

          const payload = {
            ...residential,
            amenities: residential.amenities || [],
          };

          const result = validateResidentialProfile(
            payload,
            files.map((f) => f.file),
          );

          if (!result.success) {
            const flattened = result.error.flatten();

            console.error("❌ Residential Profile Validation Failed");
            console.table(flattened.fieldErrors);
            console.log("Full Zod Error:", result.error);

            toast.error("Please fix the highlighted errors");
            return;
          }

          dispatch(submitDetailsThunk({ category: propertyType, id: draftId, payload }))
            .unwrap()
            .then((response) => {
              console.log("Property submission successful:", response);
              toast.success("Property submitted successfully");

              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
              // optional success redirect
              router.push("/my-properties");
            })
            .catch((error: any) => {
              console.log("🔥 FULL ERROR FROM API:", error);

              const errObj =
                typeof error === "string"
                  ? { message: error }
                  : error?.response?.data || error;

              toast.error(errObj?.message || "Failed to submit property");

              if (
                errObj?.code === "NO_VALID_PLAN" ||
                errObj?.code === "PLAN_LIMIT_REACHED"
              ) {
                const listingType = residential.listingType || "sale";

                const redirectUrl =
                  listingType === "sale"
                    ? "/plans/pricing/owner-sell"
                    : "/plans/pricing/owner-rent";

                console.log("🚀 Redirecting to:", redirectUrl);

                setTimeout(() => {
                  router.push(redirectUrl);
                }, 800);
              }
            });
        }}
        className="py-2 btn-primary text-white rounded-md cursor-pointer w-full"
      >
        Submit Property
      </button>
    </div>
  );
};

export default ResidentialProfile;
