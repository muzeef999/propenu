"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch } from "@/Redux/store";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import { submitVerificationThunk } from "@/Redux/thunks/submitPropertyApi";

import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { validatePropertyVerify } from "@/zod/verificationZod/PropertyVerifyZod";

/* =========================
   DOCUMENT CONFIG (IMPORTANT)
========================= */

const VERIFICATION_DOCS = [
  {
    key: "sale-deed",
    label: "Sale Deed",
    verificationType: "SALE_DEED",
    title: "sale-deed",
    showInfo: true, // ✅
  },
  {
    key: "ec",
    label: "Encumbrance Certificate (EC)",
    verificationType: "ENCUMBRANCE_CERTIFICATE",
    title: "encumbrance-certificate",
    showInfo: true, // ✅
  },
  {
    key: "municipal-tax",
    label: "Municipal Tax (Receipt)",
    verificationType: "MUNICIPAL_TAX",
    title: "municipal-tax",
    showInfo: false,
  },
  {
    key: "utility-bill",
    label: "Water or Electricity Bill",
    verificationType: "UTILITY_BILL",
    title: "utility-bill",
    showInfo: false,
  },
];

type VerifyPropertyProps = {
  onVerificationSubmitted?: (meta: {
    isSubmitted: boolean;
    isApproved: boolean;
    submittedAt?: string;
    reviewAt?: string;
    approvedAt?: string;
  }) => void;
};

const VerifyProperty: React.FC<VerifyPropertyProps> = ({
  onVerificationSubmitted,
}) => {
  const { residential, commercial, land, agricultural, draftId, propertyType, base } = useSelector(
    (state: any) => state.postProperty,
  );

  const dispatch = useAppDispatch();
  const router = useRouter();

  const profileData =
    propertyType === "residential"
      ? residential
      : propertyType === "commercial"
        ? commercial
        : propertyType === "land"
          ? land
          : agricultural;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const didHydratePrefill = useRef(false);

  const prefilledFiles = useMemo<UploadedFile[]>(() => {
    const docs = Array.isArray(profileData?.verificationDocuments)
      ? profileData.verificationDocuments
      : [];

    return docs
      .filter((doc: any) => Boolean(doc?.url))
      .slice(0, 1)
      .map((doc: any) => ({
        preview: doc.url,
        source: "server",
        name: doc.filename || doc.title || "verification-document",
      }));
  }, [profileData?.verificationDocuments]);

  useEffect(() => {
    if (didHydratePrefill.current) return;
    if (!prefilledFiles.length) return;

    setFiles(prefilledFiles);
    didHydratePrefill.current = true;
  }, [prefilledFiles]);

  const localFiles = files
    .map((f) => f.file)
    .filter((file): file is File => file instanceof File);
  const hasServerFile = files.some((file) => file.source === "server");

  const validationResult = hasServerFile
    ? null
    : validatePropertyVerify({
        verificationDocuments: localFiles,
      });

  const fieldErrors =
    showErrors && validationResult && !validationResult.success
      ? validationResult.error.flatten().fieldErrors
      : {};

  /* =========================
     SUBMIT HANDLER
  ========================= */

  const handleSubmit = () => {
    setShowErrors(true);

    const result = hasServerFile
      ? null
      : validatePropertyVerify({
          verificationDocuments: localFiles,
        });

    if (result && !result.success) {
      toast.error("Please upload a verification document");
      return;
    }

    if (!files.length) {
      toast.error("Please upload verification document");
      return;
    }

    const selectedDoc = VERIFICATION_DOCS.find(
      (d) => d.key === profileData?.verificationDocument,
    );

    if (!selectedDoc) {
      toast.error("Invalid verification document selected");
      return;
    }

    // ✅ BUILD FORMDATA (EXACT BACKEND KEYS)
    const formData = new FormData();
    formData.append("verificationType", selectedDoc.verificationType);
    formData.append("title", selectedDoc.title);
    const localFile = files.find((f) => f.source === "local" && f.file)?.file;
    if (localFile) {
      formData.append("verificationDocuments", localFile);
    }

    dispatch(
      submitVerificationThunk({
        category: propertyType,
        id: draftId,
        payload: formData, // ✅ MUST BE FORMDATA
      }),
    )
      .unwrap()
      .then((res: any) => {
        toast.success("Property is under review");

        const data = res?.data;
        const approved = Boolean(res?.verified);
        const updatedAt = data?.updatedAt || new Date().toISOString();

        onVerificationSubmitted?.({
          isSubmitted: true,
          isApproved: approved,
          submittedAt: data?.createdAt || base?.createdAt || updatedAt,
          reviewAt: updatedAt,
          approvedAt: approved ? updatedAt : undefined,
        });
      })
      .catch((error: any) => {
       
        const errObj =
          error?.response?.data ??
          (typeof error === "string" ? { message: error } : error);

       
        // 🔴 NO ACTIVE PLAN
        if (errObj?.code === "NO_VALID_PLAN") {
          toast.error(errObj.message || "Please subscribe to a plan");

          const listingType = profileData?.listingType || "sale";

          console.log(profileData?.listingType);
          console.log("🚀 Redirecting to plan selection for:", listingType);
          

          const redirectUrl =
            listingType === "sale"
              ? "/plans/pricing/owner-sell"
              : "/plans/pricing/owner-rent";

          setTimeout(() => {
            router.push(redirectUrl);
          }, 800);

          return;
        }

        // 🔴 PLAN LIMIT REACHED
        if (errObj?.code === "PLAN_LIMIT_REACHED") {
          router.push("/plans/pricing");
          toast.error("Your plan limit is reached");

       
          return;
        }

        // 🔴 Fallback
        toast.error(errObj?.message || "Verification failed");
      });
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">
          Select any one of the required documents below to verify your property
        </p>

        <div className="space-y-4">
          {VERIFICATION_DOCS.map((doc) => {
            const selected = profileData?.verificationDocument === doc.key;

            return (
              <label
                key={doc.key}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                {/* Native radio */}
                <input
                  type="radio"
                  name="verificationDocument"
                  checked={selected}
                  onChange={() =>
                    dispatch(
                      setProfileField({
                        propertyType,
                        key: "verificationDocument",
                        value: doc.key,
                      }),
                    )
                  }
                  className="h-4 w-4 text-green-600 focus:ring-green-600"
                />

                {/* Label text */}
                <span className="text-sm text-gray-800">{doc.label}</span>

                {/* Optional info icon */}
                {doc.showInfo && (
                  <span
                    className="text-gray-400 cursor-pointer"
                    title="Please Upload in PDF format only"
                  >
                    ⓘ
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* FILE UPLOAD */}
      <div>
        <FileUpload
          label="Upload Verification Document"
          value={files}
          onChange={setFiles}
          accept="image/*,.pdf"
          maxFiles={1}
          maxSizeMB={5}
        />
        {fieldErrors?.verificationDocuments?.[0] && (
          <p className="text-xs text-red-500 mt-1">
            {fieldErrors.verificationDocuments[0]}
          </p>
        )}
      </div>

      {/* SUBMIT */}
      <button
        type="button"
        onClick={handleSubmit}
        className="btn-primary w-full py-2 rounded-md text-white"
      >
        Submit Property
      </button>
    </div>
  );
};

export default VerifyProperty;
