import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import {
  nextStep,
  resetPostProperty,
  setBaseField,
  setProfileField,
  showAgentSubmissionSuccess,
} from "@/Redux/slice/postPropertySlice";
import InputField from "@/ui/InputField";
import TextArea from "@/ui/TextArae";
import AmenitiesSelect from "./AmenitiesSelect";
import { AMENITIES, LAND_PLOT_AMENITIES } from "../constants/amenities";
import { useAppDispatch } from "@/Redux/store";
import Dropdownui from "@/ui/DropDownUI";
import Toggle from "@/ui/ToggleSwitch";
import InputWithUnit from "@/ui/InputwithUnit";
import {
  createDraftThunk,
  submitDetailsThunk,
} from "@/Redux/thunks/submitPropertyApi";
import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { clearFileStore, setFileStoreFiles } from "@/utilies/fileStore";
import { validateLandProfile } from "@/zod/profileZods/landProfileZod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteGalleryImageApi } from "@/Redux/apis";
import { InfoIcon } from "@/icons/icons";

function getSubmitCategory(propertyType?: string) {
  return propertyType === "project" ? "land" : propertyType ?? "land";
}



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
  const { land, draftId, propertyType, base } = useSelector((state: any) => state.postProperty); const [files, setFiles] = useState<UploadedFile[]>([]);
  const router = useRouter();
  const [showErrors, setShowErrors] = useState(false);
  const [isListedSuccessfully, setIsListedSuccessfully] = useState(false);
  const [isAgentPosting, setIsAgentPosting] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const normalizedRole = String(localStorage.getItem("role") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_");
    setIsAgentPosting(
      normalizedRole === "agent" || normalizedRole === "sales_agent",
    );
  }, []);

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
  const localFiles = files
    .map((f) => f.file)
    .filter((file): file is File => Boolean(file));

  const validationResult = validateLandProfile(
    land,
    localFiles,
    files.filter((f) => f.source === "server").length,
  );
  const fieldErrors =
    showErrors && !validationResult.success
      ? validationResult.error.flatten().fieldErrors
      : {};

  useEffect(() => {
    if (!land?.gallery || land.gallery.length === 0) return;
    if (files.length > 0) return;

    const serverFiles: UploadedFile[] = land.gallery.map((img: any) => ({
      preview: img.url,
      source: "server",
      name: img.filename,
    }));

    setFiles(serverFiles);
  }, [land?.gallery, files.length]);

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
          name: f.file?.name ?? f.name ?? "",
          source: f.source,
          preview: f.preview,
        })),
      }),
    );

    dispatch(
      setProfileField({
        propertyType: "land",
        key: "gallery",
        value: serverGallery,
      }),
    );

    setFileStoreFiles(
      "postProperty",
      newFiles
        .filter((f) => f.source === "local")
        .map((f) => f.file)
        .filter((file): file is File => Boolean(file)),
    );
  };


  return (
    <div className="space-y-8">
      {/* 1. PLOT DETAILS */}
      <div className="space-y-6">



        <div className="grid grid-cols-1 gap-1">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-gray-700">Layout Type</p>

              <div className="relative group">
                <InfoIcon size={16} color="#9CA3AF" />

                <div className="absolute left-1/2 bottom-full z-50 mb-2 min-w-[205px] max-w-[320px] -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 invisible transition-all duration-200 whitespace-normal wrap-break-word group-hover:opacity-100 group-hover:visible">
                  Select the plot layout category, such as approved,
                  unapproved, gated, or individual plot.

                  <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>

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
                    className={`px-6 py-2 border rounded-md text-sm shadow-sm focus:outline-none  transition-colors ${active ? "border-green-500 bg-green-50 text-green-600" : "border-gray-300 text-gray-700"}`}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          {fieldErrors?.layoutType?.[0] && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.layoutType[0]}</p>
          )}
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
        </div>
      </div>

      {/* 2. AMENITIES */}
      <div className="space-y-6">
        <AmenitiesSelect
          label="Amenities"
          options={LAND_PLOT_AMENITIES}
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
          <p className="text-base font-semibold text-gray-900">
            Legal & Survey Details
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Survey Number"
            value={land.surveyNumber || ""}
            placeholder="e.g. 123/45/B"
            tooltip="Official survey or plot identification number recorded in land revenue or registration documents."
            tooltipPosition="center"
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
            tooltip="Zoning classification assigned to the land, such as residential, commercial, agricultural, or mixed use."
            tooltipPosition="center"
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
          <p className="text-base font-semibold text-gray-900">
            Plot Features & Utilities
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
              <div
                key={item.key}
                role="button"
                tabIndex={0}
                onClick={() =>
                  dispatch(
                    setProfileField({
                      propertyType: "land",
                      key: item.key,
                      value: !enabled,
                    })
                  )
                }
                className={`flex items-center justify-between rounded-md border p-3 shadow-sm transition
            ${enabled
                    ? "border-green-500 bg-green-50 shadow-sm"
                    : "border-gray-300 bg-white"
                  }`}
              >
                <span
                  className={`text-sm font-medium ${enabled ? "text-green-700" : "text-gray-700"
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
              </div>

            );
          })}
        </div>
      </div>
      {/* 5. PRICE & OTHER DETAILS */}
      <div className="space-y-6">
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
                await deleteGalleryImageApi("land", draftId, serverIndex);
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
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            minFiles={5}
            maxFiles={10}
            maxSizeMB={1}
            error={fieldErrors?.images?.[0]}
          />
        </div>


        <div
          className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 ${land.isPriceNegotiable ? "border-green-500 bg-green-50 shadow-sm" : ""}`}
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
              className={`text-xs font-medium ${land.isPriceNegotiable ? "text-green-600" : "text-gray-400"
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
          blockPhoneNumbers
          onPhoneBlocked={() =>
            toast.error("Phone numbers, emails, and house addresses are not allowed in the description")
          }
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
          if (isListedSuccessfully) {
            router.push("/agent/my-properties");
            return;
          }

          setShowErrors(true);

          const payload = {
            ...land,

            amenities: Array.isArray(land.amenities)
              ? land.amenities.map((a: any) => a?.title).filter(Boolean)
              : [],
          };

          const serverImageCount = files.filter(
            (f) => f.source === "server",
          ).length;
          const localImageCount = files.filter((f) => f.source === "local").length;
          if (serverImageCount + localImageCount < 5) {
            toast.error("Upload at least 5 images");
            return;
          }

          const result = validateLandProfile(
            payload,
            localFiles,
            serverImageCount,
          );

          if (!result.success) {
            const flattened = result.error.flatten();

            console.table(flattened.fieldErrors);

            toast.error("Please fix the highlighted errors");
            return;
          }

          // 🚀 IMPORTANT: send ORIGINAL agricultural object to backend
          const submitCategory = getSubmitCategory(propertyType);

          dispatch(
            submitDetailsThunk({
              category: submitCategory,
              id: draftId,
              payload: land, // backend/thunk will format this
            }),
          )
            .unwrap()
            .then((response) => {
              if (isAgentPosting) {
                toast.success("Property listed successfully.");
                clearFileStore("postProperty");
                setFiles([]);
                dispatch(resetPostProperty({ propertyType: submitCategory as any }));
                dispatch(showAgentSubmissionSuccess());
                dispatch(
                  createDraftThunk({
                    category: submitCategory,
                    listingType: base?.listingType,
                  }),
                )
                  .unwrap()
                  .catch(() => {
                    toast.error("Property submitted, but new draft creation failed.");
                  });
                return;
              }

              dispatch(nextStep()); // Move to next step on success


            })
            .catch((error: any) => {

              const errObj =
                typeof error === "string"
                  ? { message: error }
                  : error?.response?.data || error;

              toast.error(errObj?.message || "Failed to submit property");

              if (
                errObj?.code === "NO_VALID_PLAN" ||
                errObj?.code === "PLAN_LIMIT_REACHED"
              ) {
                const listingType = land.listingType || "sale";

                const redirectUrl =
                  listingType === "sale"
                    ? "/plans/pricing/owner-sell"
                    : "/plans/pricing/owner-rent";


                setTimeout(() => {
                  router.push(redirectUrl);
                }, 800);
              }
            });
        }}
        className="py-2 btn-primary text-white rounded-md cursor-pointer w-full"
      >
        {isListedSuccessfully
          ? "Go to My Properties"
          : isAgentPosting
            ? "Submit"
            : "Continue"}
      </button>
    </div>
  );
};

export default LandProfile;
