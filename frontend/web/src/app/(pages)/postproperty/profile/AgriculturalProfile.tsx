import { useSelector } from "react-redux";
import {
  nextStep,
  resetPostProperty,
  setBaseField,
  setProfileField,
  showAgentSubmissionSuccess,
} from "@/Redux/slice/postPropertySlice";
import CounterField from "@/ui/CounterField";
import InputField from "@/ui/InputField";
import TextArea from "@/ui/TextArae";
import { useAppDispatch } from "@/Redux/store";
import Dropdownui from "@/ui/DropDownUI";
import ToggleSwitch from "@/ui/ToggleSwitch";
import {
  createDraftThunk,
  submitDetailsThunk,
} from "@/Redux/thunks/submitPropertyApi";
import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { clearFileStore, setFileStoreFiles } from "@/utilies/fileStore";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { validateAgriculturalProfile } from "@/zod/profileZods/agriculturalZod";
import AmenitiesSelect from "./AmenitiesSelect";
import { AGRICULTURAL_AMENITIES } from "../constants/amenities";
import { deleteGalleryImageApi } from "@/Redux/apis";

const SOIL_TYPES = [
  "clay",
  "sandy",
  "loamy",
  "red-soil",
  "black-soil",
  "alluvial",
] as const;

const IRRIGATION_TYPES = [
  "canal",
  "bore-well",
  "tube-well",
  "open-well",
  "sprinkler",
  "drip",
  "rain-fed",
] as const;

const WATER_SOURCES = [
  "bore-well",
  "open-well",
  "tube-well",
  "canal",
  "river",
  "tank",
  "pond",
] as const;

const ACCESS_ROAD_TYPES = [
  "paved",
  "unpaved",
  "gravel",
  "concrete",
  "earthen",
] as const;

const AgriculturalProfile = () => {
  const { agricultural, draftId, propertyType } = useSelector((state: any) => state.postProperty);
  const dispatch = useAppDispatch();
  const [showErrors, setShowErrors] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const router = useRouter();
  const [isListedSuccessfully, setIsListedSuccessfully] = useState(false);
  const [isAgentPosting, setIsAgentPosting] = useState(false);
  const extractFiles = (files: UploadedFile[]): File[] =>
    files
      .map((f) => f.file)
      .filter((file): file is File => file instanceof File);

  useEffect(() => {
    const normalizedRole = String(localStorage.getItem("role") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_");
    setIsAgentPosting(
      normalizedRole === "agent" || normalizedRole === "sales_agent",
    );
  }, []);

  const serverImageCount = files.filter((f) => f.source === "server").length;
  const localImageCount = files.filter((f) => f.source === "local").length;
  const validationResult = validateAgriculturalProfile(
    agricultural,
    extractFiles(files),
  );
  const formattedErrors =
    showErrors && !validationResult.success
      ? validationResult.error.format()
      : undefined;

  const showBorewellDetails = agricultural.waterSource === "bore-well";
  const fieldErrors = formattedErrors;
  const borewellErrors = formattedErrors?.borewellDetails;
  const validUploads = files.filter(
    (f): f is UploadedFile & { file: File } => f.file instanceof File
  )
  useEffect(() => {
    if (!agricultural?.gallery || agricultural.gallery.length === 0) return;
    if (files.length > 0) return; // don't overwrite user-selected files

    const serverFiles: UploadedFile[] = agricultural.gallery.map((img: any) => ({
      preview: img.url,
      source: "server",
      name: img.filename,
    }));

    setFiles(serverFiles);
  }, [agricultural?.gallery, files.length]);

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
        propertyType: "agricultural",
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
    <div className="space-y-10">
      {/* ========== PROPERTY BASICS ========== */}
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold text-gray-900">Property Basics</p>
          <p className="text-xs text-gray-500">
            Enter the size, road access, and plantation age of the land
          </p>
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-3 gap-4">
          <CounterField
            label="Plantation Age (years)"
            value={agricultural.plantationAge || 0}
            min={0}
            tooltip="Age of the existing plantation or crop trees on the land, measured in years."
            tooltipPosition="center"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "plantationAge",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      <div className="space-y-6">
        <AmenitiesSelect
          label="Amenities"
          options={AGRICULTURAL_AMENITIES}
          value={agricultural.amenities || []}
          onChange={(value) =>
            dispatch(
              setProfileField({ propertyType: "agricultural", key: "amenities", value })
            )
          }
        />
      </div>

      {/* ========== SOIL & IRRIGATION ========== */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Soil & Irrigation
          </p>
          <p className="text-xs text-gray-500">
            Select soil type, irrigation method, and available water sources
          </p>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Dropdownui
            label="Soil Type"
            value={agricultural.soilType || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "soilType",
                  value,
                })
              )
            }
            options={SOIL_TYPES.map((t) => ({
              value: t,
              label: t.replace("-", " "),
            }))}
            placeholder="Select"
          />

          <Dropdownui
            label="Irrigation Type"
            value={agricultural.irrigationType || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "irrigationType",
                  value,
                })
              )
            }
            options={IRRIGATION_TYPES.map((t) => ({
              value: t,
              label: t.replace("-", " "),
            }))}
            placeholder="Select"
          />

          <Dropdownui
            label="Water Source"
            value={agricultural.waterSource || null}
            onChange={(value) => {
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "waterSource",
                  value,
                })
              );

              if (value !== "bore-well") {
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "numberOfBorewells",
                    value: 0,
                  }),
                );
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "borewellDetails",
                    value: undefined,
                  }),
                );
              }
            }}
            options={WATER_SOURCES.map((t) => ({
              value: t,
              label: t.replace("-", " "),
            }))}
            placeholder="Select"
          />
        </div>
      </div>

      {showBorewellDetails && (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Borewell Details
            </p>
            <p className="text-xs text-gray-500">
              Provide borewell count, depth, yield, and drilling year
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CounterField
              label="Number of Borewells"
              value={agricultural.numberOfBorewells || 0}
              min={0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "numberOfBorewells",
                    value,
                  })
                )
              }
            />

            {agricultural.numberOfBorewells > 0 && (
              <>
                {/* ================= DEPTH ================= */}
                <div>
                  <InputField
                    label="Borewell Depth (meters)"
                    type="number"
                    value={agricultural.borewellDetails?.depthMeters || ""}
                    placeholder="e.g. 100"
                    onChange={(value) =>
                      dispatch(
                        setProfileField({
                          propertyType: "agricultural",
                          key: "borewellDetails",
                          value: {
                            ...agricultural.borewellDetails,
                            depthMeters: Number(value) || 0,
                          },
                        }),
                      )
                    }
                  />

                  {borewellErrors?.depthMeters?._errors?.[0] && (
                    <p className="text-red-500 text-xs mt-1">
                      {borewellErrors.depthMeters._errors[0]}
                    </p>
                  )}

                </div>

                {/* ================= YIELD ================= */}
                <div>
                  <InputField
                    label="Yield (LPM)"
                    type="number"
                    value={agricultural.borewellDetails?.yieldLpm || ""}
                    placeholder="e.g. 5000"
                    onChange={(value) =>
                      dispatch(
                        setProfileField({
                          propertyType: "agricultural",
                          key: "borewellDetails",
                          value: {
                            ...agricultural.borewellDetails,
                            yieldLpm: Number(value) || 0,
                          },
                        }),
                      )
                    }
                  />

                  {borewellErrors?.yieldLpm?._errors?.[0] && (
                    <p className="text-red-500 text-xs mt-1">
                      {borewellErrors.yieldLpm._errors[0]}
                    </p>
                  )}

                </div>

                {/* ================= DRILLED YEAR ================= */}
                <div>
                  <InputField
                    label="Drilled Year"
                    type="number"
                    value={agricultural.borewellDetails?.drilledYear || ""}
                    placeholder="e.g. 2020"
                    onChange={(value) =>
                      dispatch(
                        setProfileField({
                          propertyType: "agricultural",
                          key: "borewellDetails",
                          value: {
                            ...agricultural.borewellDetails,
                            drilledYear: Number(value) || 0,
                          },
                        }),
                      )
                    }
                  />

                  {borewellErrors?.drilledYear?._errors?.[0] && (
                    <p className="text-red-500 text-xs mt-1">
                      {borewellErrors.drilledYear._errors[0]}
                    </p>
                  )}

                </div>

                {/* ================= OBJECT LEVEL ERROR ================= */}
                {Array.isArray(borewellErrors) && borewellErrors[0] && (
                  <p className="text-red-600 text-xs mt-2">
                    {borewellErrors[0]}
                  </p>
                )}
              </>
            )}

          </div>
        </div>
      )}

      {/* ========== CROP DETAILS ========== */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">Crop Details</p>
          <p className="text-xs text-gray-500">
            Mention current crops, land usage, and suitable cultivation types
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Current Crop"
            value={agricultural.currentCrop || ""}
            placeholder="e.g. Sugarcane"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "currentCrop",
                  value,
                })
              )
            }
          />

          <InputField
            label="Suitable For"
            value={agricultural.suitableFor || ""}
            placeholder="e.g. Cotton, Wheat"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "suitableFor",
                  value,
                })
              )
            }
          />

          <InputField
            label="Land Shape"
            value={agricultural.landShape || ""}
            placeholder="e.g. Square, Rectangular"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "landShape",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      {/* ========== LEGAL DOCUMENTS ========== */}
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Legal & Accessibility
          </p>
          <p className="text-xs text-gray-500">
            Provide information about purchase restrictions and access road type
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ================= STATE PURCHASE RESTRICTIONS ================= */}
          <div>
            <InputField
              label="State Purchase Restrictions"
              value={agricultural.statePurchaseRestrictions || ""}
              placeholder="e.g. None, Restricted"
              tooltip="Mention any state-specific rules or eligibility restrictions that apply to buying this agricultural land."
              tooltipPosition="center"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "statePurchaseRestrictions",
                    value,
                  }),
                )
              }
            />

            {fieldErrors?.statePurchaseRestrictions?.[0] && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.statePurchaseRestrictions[0]}
              </p>
            )}
          </div>

          {/* ================= ACCESS ROAD TYPE ================= */}
          <div>
            <InputField
              label="Access Road Type"
              value={agricultural.accessRoadType || ""}
              placeholder="e.g. Paved, Unpaved"
              tooltip="Type of road to the property (Tar road, Mud road, Gravel road)"
              tooltipPosition="center"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "accessRoadType",
                    value,
                  }),
                )
              }
            />

            {fieldErrors?.accessRoadType?._errors?.[0] && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.accessRoadType._errors[0]}
              </p>
            )}

          </div>
        </div>
      </div>


      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-900">Site Features</p>
          <p className="text-xs text-gray-500">
            Specify available infrastructure and on-site facilities
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Boundary Wall */}
          <div
            className={`flex items-center justify-between rounded-md border p-3 transition-colors ${agricultural.boundaryWall
              ? "border-green-500 bg-green-50 shadow-sm"
              : "border-gray-300 bg-white hover:border-gray-400"
              }`}
          >
            <span
              className={`text-sm font-medium ${agricultural.boundaryWall ? "text-green-800" : "text-gray-700"
                }`}
            >
              Boundary Wall
            </span>

            <ToggleSwitch
              enabled={agricultural.boundaryWall || false}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "boundaryWall",
                    value,
                  })
                )
              }
            />
          </div>

          {/* Electricity Connection */}
          <div
            className={`flex items-center justify-between rounded-md border p-3 transition-colors ${agricultural.electricityConnection
              ? "border-green-500 bg-green-50 shadow-sm"
              : "border-gray-300 bg-white hover:border-gray-400"
              }`}
          >
            <span
              className={`text-sm font-medium ${agricultural.electricityConnection
                ? "text-green-800"
                : "text-gray-700"
                }`}
            >
              Electricity Connection
            </span>

            <ToggleSwitch
              enabled={agricultural.electricityConnection || false}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "agricultural",
                    key: "electricityConnection",
                    value,
                  })
                )
              }
            />
          </div>
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
              await deleteGalleryImageApi("agricultural", draftId, serverIndex);
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
          error={fieldErrors?.images?._errors?.[0]}
        />

      </div>

      <div
        className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 ${agricultural.isPriceNegotiable
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
            className={`text-xs font-medium ${agricultural.isPriceNegotiable
              ? "text-green-600"
              : "text-gray-400"
              }`}
          >
            {agricultural.isPriceNegotiable ? "YES" : "NO"}
          </span>
          <ToggleSwitch
            enabled={agricultural.isPriceNegotiable || false}
            onChange={(val) =>
              dispatch(
                setProfileField({
                  propertyType: "agricultural",
                  key: "isPriceNegotiable",
                  value: val,
                })
              )
            }
          />
        </div>
      </div>

      {/* ========== ADDITIONAL DESCRIPTION ========== */}
      <div className="space-y-4">
        <TextArea
          label="Additional Description"
          value={agricultural.description || ""}
          maxLength={500}
          placeholder="e.g. The land has a gentle slope and is ideal for cultivating a variety of crops. It is well-connected to the main road and has access to electricity and water supply."
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "agricultural",
                key: "description",
                value,
              })
            )
          }
        />
        {fieldErrors?.description?._errors?.[0] && (
          <p className="text-red-500 text-xs">
            {fieldErrors.description._errors[0]}
          </p>
        )}
      </div>

      {/* ========== SUBMIT BUTTON ========== */}
      <button
        type="button"
        onClick={() => {
          if (isListedSuccessfully) {
            router.push("/agent/my-properties");
            return;
          }

          setShowErrors(true);

          // ✅ FIX: convert amenities objects → string[] ONLY for validation
          const payload = {
            ...agricultural,

            amenities: Array.isArray(agricultural.amenities)
              ? agricultural.amenities.map((a: any) => a?.title).filter(Boolean)
              : [],
          };

          if (serverImageCount + localImageCount < 5) {
            toast.error("Upload at least 5 images");
            return;
          }

          const result = validateAgriculturalProfile(payload, extractFiles(files));


          if (!result.success) {
            const flattened = result.error.flatten();

            console.error("❌ Agricultural Profile Validation Failed");
            console.table(flattened.fieldErrors);

            toast.error("Please fix the highlighted errors");
            return;
          }

          // 🚀 IMPORTANT: send ORIGINAL agricultural object to backend
          dispatch(
            submitDetailsThunk({
              category: propertyType,
              id: draftId,
              payload: agricultural, // backend/thunk will format this
            }),
          )
            .unwrap()
            .then((response) => {
              if (isAgentPosting) {
                toast.success("Property listed successfully.");
                clearFileStore("postProperty");
                setFiles([]);
                dispatch(resetPostProperty({ propertyType }));
                dispatch(showAgentSubmissionSuccess());
                dispatch(createDraftThunk(propertyType))
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
                const listingType = agricultural.listingType || "sale";

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

export default AgriculturalProfile;
