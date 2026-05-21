import { useDispatch, useSelector } from "react-redux";
import { nextStep, setBaseField, setProfileField } from "@/Redux/slice/postPropertySlice";
import CounterField from "@/ui/CounterField";
import InputField from "@/ui/InputField";
import AmenitiesSelect from "./AmenitiesSelect";
import { COMMERCIAL_AMENITIES } from "../constants/amenities";
import TextArea from "@/ui/TextArae";
import { useAppDispatch } from "@/Redux/store";
import Dropdownui from "@/ui/DropDownUI";
import Toggle from "@/ui/ToggleSwitch";
import { useEffect, useState } from "react";
import { submitDetailsThunk } from "@/Redux/thunks/submitPropertyApi";
import { validateCommercialProfile } from "@/zod/profileZods/commercialProfileZod";
import { toast } from "sonner";
import Router from "next/router";
import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { setFileStoreFiles } from "@/utilies/fileStore";
import { set } from "zod";
import { deleteGalleryImageApi } from "@/Redux/apis";
import { InfoIcon } from "@/icons/icons";

export const TRANSACTION_TYPES = [
  "new-sale",
  "resale",
  "pre-leased",
  "rent",
  "lease",
] as const;

export const CONSTRUCTION_STATUS = [
  "ready-to-move",
  "under-construction",
  "new-lanch",
] as const;

export const PANTRY_TYPES = ["none", "shared", "no-shared"] as const;

export const FLOORING_TYPES = [
  "bare-cement",
  "vitrified-tiles",
  "ceramic-tiles",
  "marble",
  "granite",
  "carpet",
  "epoxy",
  "wooden-laminate",
] as const;

const CommercialProfile = () => {
  const { commercial, draftId, propertyType } = useSelector(
    (state: any) => state.postProperty,
  );
  const dispatch = useAppDispatch();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showErrors, setShowErrors] = useState(false);
  const showTenantInformation = ["rent", "lease"].includes(
    String(commercial.listingType ?? "").toLowerCase(),
  );

  // const localFiles = files
  //   .map((f) => f.file)
  //   .filter((file): file is File => Boolean(file));
  // const serverImageCount = commercial.gallery?.length ?? 0;
  // const localImageCount = files.filter((f) => f.source === "local").length;

  useEffect(() => {
    if (!commercial?.gallery || commercial.gallery.length === 0) return;
    if (files.length > 0) return; // don't overwrite user changes

    const serverFiles: UploadedFile[] = commercial.gallery.map((img: any) => ({
      preview: img.url,
      source: "server",
      name: img.filename,
    }));

    setFiles(serverFiles);
  }, [commercial?.gallery, files.length]);
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
        propertyType: "commercial",
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
    <div className="space-y-8">
      {/* ========== PROPERTY BASICS ========== */}
      <div className="space-y-6">
        <div>
          <AmenitiesSelect
            label="Amenities"
            options={COMMERCIAL_AMENITIES}
            value={commercial.amenities || []}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "amenities",
                  value,
                }),
              )
            }
          />
          {fieldErrors?.amenities?.[0] && (
            <p className="mt-1 text-xs text-red-500">
              {fieldErrors.amenities[0]}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {/* Section Title */}
          <p className="text-sm font-medium text-gray-800">
            Parking Details (Optional)
          </p>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-7 sm:grid-cols-2 md:grid-cols-3">
            {/* Two Wheeler */}
            <CounterField
              label="Two-Wheeler Parking"
              value={commercial.parkingDetails?.twoWheeler || 0}
              min={0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "parkingDetails",
                    value: {
                      ...commercial.parkingDetails,
                      twoWheeler: value,
                    },
                  }),
                )
              }
              error={fieldErrors?.parkingDetails?.[0]}
            />

            {/* Four Wheeler */}
            <CounterField
              label="Four-Wheeler Parking"
              value={commercial.parkingDetails?.fourWheeler || 0}
              min={0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "parkingDetails",
                    value: {
                      ...commercial.parkingDetails,
                      fourWheeler: value,
                    },
                  }),
                )
              }
              error={fieldErrors?.parkingDetails?.[0]}
            />
          </div>
        </div>
        <div className="space-y-3">
          {/* Section Title */}
          <p className="text-sm font-medium text-gray-800">Floor Details</p>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-7 sm:grid-cols-2 md:grid-cols-3 items-start">
            {/* Flooring Type */}
            <Dropdownui
              label="Flooring Type"
              value={commercial.flooringType || null}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
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
              error={fieldErrors?.flooringType?.[0]}
            />

            {/* Floor Number */}
            <CounterField
              label="Floor Number"
              min={0}
              value={commercial.floorNumber ?? 0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "floorNumber",
                    value,
                  }),
                )
              }
              error={fieldErrors?.floorNumber?.[0]}
            />

            {/* Total Floors */}
            <CounterField
              label="Total Floors"
              min={0}
              value={commercial.totalFloors ?? 0}
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "totalFloors",
                    value,
                  }),
                )
              }
              error={fieldErrors?.totalFloors?.[0]}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-7 sm:grid-cols-3 items-end">
          <Dropdownui
            label="Pantry Type"
            value={commercial.pantry?.type || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "pantry",
                  value: { ...commercial.pantry, type: value },
                }),
              )
            }
              options={PANTRY_TYPES.map((t) => ({
                value: t,
                label: t.replace("-", " "),
              }))}
              placeholder="Select"
              error={fieldErrors?.pantry?.[0]}
            />

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Inside Premises
            </label>

            <div
              className="flex py-2 items-center justify-between rounded-md border
               border-gray-300 bg-white px-4
               shadow-sm transition
               hover:border-gray-400 mt-2"
            >
              <span className="text-sm text-gray-700">Available</span>

              <input
                type="checkbox"
                checked={commercial.pantry?.insidePremises || false}
                onChange={(e) =>
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "pantry",
                      value: {
                        ...commercial.pantry,
                        insidePremises: e.target.checked,
                      },
                    }),
                  )
                }
                className="h-5 w-5 accent-green-600 cursor-pointer"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ========== BUILDING MANAGEMENT ========== */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-gray-900">
              Building Management
            </p>

            <div className="relative group">
              <InfoIcon size={16} color="#9CA3AF" />

              <div className="absolute left-1/2 bottom-full z-50 mb-2 min-w-[205px] max-w-[320px] -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 invisible transition-all duration-200 whitespace-normal wrap-break-word group-hover:opacity-100 group-hover:visible">
                Add details about how the building is operated or maintained,
                such as maintenance responsibility, staffing, or common
                facility management.

                <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Provide building management details
          </p>
        </div>

        <div className="space-y-3 grid grid-cols-2 md:grid-cols-2 gap-7">
          <InputField
            label=" Management Company"
            value={commercial.buildingManagement?.managedBy || ""}
            placeholder="e.g. ABC Property Management"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "buildingManagement",
                  value: {
                    ...commercial.buildingManagement,
                    managedBy: value,
                  },
                }),
              )
            }
            error={fieldErrors?.buildingManagement?.[0]}
          />

          <InputField
            label="Management Contact"
            value={commercial.buildingManagement?.contact || ""}
            placeholder="e.g. +91-XXXXXXXXXX"
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "buildingManagement",
                  value: {
                    ...commercial.buildingManagement,
                    contact: value,
                  },
                }),
              )
            }
            error={fieldErrors?.buildingManagement?.[0]}
          />
        </div>
      </div>

      {/* ========== ZONING ========== */}
      <div className="space-y-3">
        <InputField
          label="Zoning Information"
          value={commercial.zoning || ""}
          placeholder="e.g. Commercial Zone B2"
          tooltip="Zoning classification assigned to the property, indicating the type of commercial use permitted in that area."
          tooltipPosition="center"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "zoning",
                value,
              }),
            )
          }
          error={fieldErrors?.zoning?.[0]}
        />
      </div>

      {/* ========== TENANT INFORMATION ========== */}
      {showTenantInformation ? (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-gray-900">
                Tenant Information
              </p>

              <div className="relative group">
                <InfoIcon size={16} color="#9CA3AF" />

                <div className="absolute left-1/2 bottom-full z-50 mb-2 min-w-[205px] max-w-[320px] -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 invisible transition-all duration-200 whitespace-normal wrap-break-word group-hover:opacity-100 group-hover:visible">
                  Include relevant details about the current or past tenants,
                  such as occupancy status, business type, or lease background.

                  <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Add details about current or previous tenants
            </p>
          </div>

          {(commercial.tenantInfo || []).map((tenant: any, index: number) => (
            <div
              key={index}
              className="border rounded-lg p-4 border-gray-300 px-4 shadow-sm transition hover:border-gray-400 mt-2"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Tenant #{index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const updatedTenants =
                      commercial.tenantInfo?.filter(
                        (_: any, i: number) => i !== index,
                      ) || [];
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "tenantInfo",
                        value: updatedTenants,
                      }),
                    );
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <InputField
                  label="Tenant Name"
                  value={tenant.currentTenant || ""}
                  placeholder="e.g. ABC Corporation"
                  onChange={(value) => {
                    const updatedTenants = [...(commercial.tenantInfo || [])];
                    updatedTenants[index] = { ...tenant, currentTenant: value };
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "tenantInfo",
                        value: updatedTenants,
                      }),
                    );
                  }}
                />

                <InputField
                  label="Monthly Rent"
                  value={tenant.rent || ""}
                  placeholder="e.g. 50,000"
                  onChange={(value) => {
                    const updatedTenants = [...(commercial.tenantInfo || [])];
                    updatedTenants[index] = {
                      ...tenant,
                      rent: value.replace(/\D/g, ""),
                    };
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "tenantInfo",
                        value: updatedTenants,
                      }),
                    );
                  }}
                />

                <InputField
                  label="Lease Start Date"
                  type="date"
                  value={
                    tenant.leaseStart ? tenant.leaseStart.split("T")[0] : ""
                  }
                  onChange={(value) => {
                    const updatedTenants = [...(commercial.tenantInfo || [])];
                    updatedTenants[index] = { ...tenant, leaseStart: value };
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "tenantInfo",
                        value: updatedTenants,
                      }),
                    );
                  }}
                />

                <InputField
                  label="Lease End Date"
                  type="date"
                  value={tenant.leaseEnd ? tenant.leaseEnd.split("T")[0] : ""}
                  onChange={(value) => {
                    const updatedTenants = [...(commercial.tenantInfo || [])];
                    updatedTenants[index] = { ...tenant, leaseEnd: value };
                    dispatch(
                      setProfileField({
                        propertyType: "commercial",
                        key: "tenantInfo",
                        value: updatedTenants,
                      }),
                    );
                  }}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const newTenant = {
                currentTenant: "",
                leaseStart: "",
                leaseEnd: "",
                rent: "",
              };
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "tenantInfo",
                  value: [...(commercial.tenantInfo || []), newTenant],
                }),
              );
            }}
            className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:text-gray-700 hover:border-gray-400 transition"
          >
            + Add Tenant
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {/* Section Header */}
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Fire Safety & Compliance
          </p>
          <p className="text-xs text-gray-500">
            Select all fire safety measures available in the property
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: "fireExtinguisher", label: "Fire Extinguisher" },
            { key: "fireSprinklerSystem", label: "Sprinkler System" },
            { key: "fireHoseReel", label: "Fire Hose Reel" },
            { key: "fireHydrant", label: "Fire Hydrant" },
            { key: "smokeDetector", label: "Smoke Detector" },
            { key: "fireAlarmSystem", label: "Fire Alarm System" },
            { key: "fireControlPanel", label: "Fire Control Panel" },
            { key: "emergencyExitSignage", label: "Fire Exit Signs" },
          ].map((item) => {
            const enabled = commercial.fireSafety?.[item.key] || false;

            return (
              <div
                key={item.key}
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
                        propertyType: "commercial",
                        key: "fireSafety",
                        value: { ...commercial.fireSafety, [item.key]: val },
                      }),
                    )
                  }
                />
              </div>
            );
          })}
        </div>
        {fieldErrors?.fireSafety?.[0] && (
          <p className="mt-1 text-xs text-red-500">
            {fieldErrors.fireSafety[0]}
          </p>
        )}
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
              await deleteGalleryImageApi("commercial", draftId, serverIndex);
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
        className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 ${commercial.isPriceNegotiable
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
            className={`text-xs font-medium ${commercial.isPriceNegotiable
              ? "text-green-600"
              : "text-gray-400"
              }`}
          >
            {commercial.isPriceNegotiable ? "YES" : "NO"}
          </span>
          <Toggle
            enabled={commercial.isPriceNegotiable || false}
            onChange={(val) =>
              dispatch(
                setProfileField({
                  propertyType: "commercial",
                  key: "isPriceNegotiable",
                  value: val,
                })
              )
            }
          />
        </div>
      </div>
      <TextArea
        label="Property Description"
        value={commercial.description || ""}
        placeholder="e.g. Spacious 3 BHK apartment with east-facing balcony, covered parking, power backup, and close to IT parks."
        maxLength={500}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType: "commercial",
              key: "description",
              value,
            }),
          )
        }
        error={fieldErrors?.description?.[0]}
      />

      <button
        type="button"
        onClick={() => {
          setShowErrors(true);

          // ✅ FIX: convert amenities objects → string[] ONLY for validation
          const payload = {
            ...commercial,

            amenities: Array.isArray(commercial.amenities)
              ? commercial.amenities.map((a: any) => a?.title).filter(Boolean)
              : [],
          };

          const serverImageCount = files.filter(
            (f) => f.source === "server",
          ).length;

          const localFiles: File[] = files
            .filter((f) => f.source === "local" && f.file)
            .map((f) => f.file as File);

          const totalImageCount = serverImageCount + localFiles.length;

          if (totalImageCount < 5) {
            setFieldErrors({
              ...fieldErrors,
              images: ["Upload at least 5 images"],
            });
            toast.error("Upload at least 5 images");
            return;
          }

          const result = validateCommercialProfile(payload, localFiles);

          if (!result.success) {
            const flattened = result.error.flatten();
            setFieldErrors(flattened.fieldErrors);

            console.error("❌ Commercial Profile Validation Failed");
            console.table(flattened.fieldErrors);

            toast.error("Please fix the highlighted errors");
            return;
          }

          setFieldErrors({}); // clear previous errors

          // 🚀 IMPORTANT: send ORIGINAL residential object to backend
          dispatch(
            submitDetailsThunk({
              category: propertyType,
              id: draftId,
              payload: commercial, // backend/thunk will format this
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
              if (
                errObj?.code === "NO_VALID_PLAN" ||
                errObj?.code === "PLAN_LIMIT_REACHED"
              ) {
                const listingType = commercial.listingType || "sale";

                const redirectUrl =
                  listingType === "sale"
                    ? "/plans/pricing/owner-sell"
                    : "/plans/pricing/owner-rent";


                setTimeout(() => {
                  Router.push(redirectUrl);
                }, 800);
              }
            });
        }}
        className="py-2 btn-primary text-white rounded-md cursor-pointer w-full"
      >
        Continue
      </button>
    </div>
  );
};

export default CommercialProfile;
