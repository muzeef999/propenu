"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { useAppDispatch } from "@/Redux/store";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import { submitVerificationThunk } from "@/Redux/thunks/submitPropertyApi";

import FileUpload, { UploadedFile } from "@/ui/FileUpload";
import { validateResidentialVerify } from "@/zod/verificationZod/residentialVerifyZod";

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

const VerifyResidential = () => {
  const { residential, draftId, propertyType } = useSelector(
    (state: any) => state.postProperty,
  );

  const dispatch = useAppDispatch();
  const router = useRouter();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const validationResult = validateResidentialVerify({
    verificationDocuments: files.map((f) => f.file),
  });


  const fieldErrors =
    showErrors && !validationResult.success
      ? validationResult.error.flatten().fieldErrors
      : {};

  /* =========================
     SUBMIT HANDLER
  ========================= */

  const handleSubmit = () => {
    setShowErrors(true);

    const result = validateResidentialVerify({
      verificationDocuments: files.map((f) => f.file),
    });

    if (!result.success) {
      toast.error("Please upload a verification document");
      return;
    }


    if (!files.length) {
      toast.error("Please upload verification document");
      return;
    }

    const selectedDoc = VERIFICATION_DOCS.find(
      (d) => d.key === residential.verificationDocument,
    );

    if (!selectedDoc) {
      toast.error("Invalid verification document selected");
      return;
    }

    // ✅ BUILD FORMDATA (EXACT BACKEND KEYS)
    const formData = new FormData();
    formData.append("verificationType", selectedDoc.verificationType);
    formData.append("title", selectedDoc.title);
    formData.append("verificationDocuments", files[0].file);

    dispatch(
      submitVerificationThunk({
        category: propertyType,
        id: draftId,
        payload: formData, // ✅ MUST BE FORMDATA
      }),
    )
      .unwrap()
      .then(() => {
        toast.success("Property verified successfully 🎉");

        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });

        router.push("/my-properties");
      })
      .catch((error: any) => {
        toast.error(error?.message || "Verification failed");
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
            const selected =
              residential.verificationDocument === doc.key;

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
                        propertyType: "residential",
                        key: "verificationDocument",
                        value: doc.key,
                      }),
                    )
                  }
                  className="h-4 w-4 text-green-600 focus:ring-green-600"
                />

                {/* Label text */}
                <span className="text-sm text-gray-800">
                  {doc.label}
                </span>

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

export default VerifyResidential;
