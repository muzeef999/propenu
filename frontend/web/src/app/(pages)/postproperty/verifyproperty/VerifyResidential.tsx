import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { setProfileField } from "@/Redux/slice/postPropertySlice";
import { submitVerificationThunk } from "@/Redux/thunks/submitPropertyApi";
import { useAppDispatch } from "@/Redux/store";
import InputField from "@/ui/InputField";
import { validateResidentialVerify } from "@/zod/verificationZod/residentialVerifyZod";

const VerifyResidential = () => {
  const { residential, draftId, propertyType } = useSelector(
    (state: any) => state.postProperty,
  );
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showErrors, setShowErrors] = useState(false);
  const validationResult = validateResidentialVerify(residential);

  const fieldErrors =
    showErrors && !validationResult.success
      ? validationResult.error.flatten().fieldErrors
      : {};

  return (
    <div className="space-y-8">
      {/* RERA Registration */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            RERA Registration
          </p>
          <p className="text-xs text-gray-500">
            Enter your property's RERA registration number
          </p>
        </div>

        <InputField
          label="RERA Registration Number"
          value={residential.reraRegistrationNumber || ""}
          placeholder="e.g. RERA2026HYD8899"
          error={fieldErrors.reraRegistrationNumber?.[0]} // ✅ ADD THIS
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "reraRegistrationNumber",
                value,
              }),
            )
          }
        />
      </div>

      {/* Approvals */}
      <div className="space-y-3">
  <div>
    <p className="text-sm font-semibold text-gray-900">Approvals</p>
    <p className="text-xs text-gray-500">
      Select all applicable approvals
    </p>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {["RERA", "HMDA", "BDA", "RCC"].map((approval) => {
      const approvals = residential.approvals || [];
      const isSelected = approvals.includes(approval);

      return (
        <div
          key={approval}
          onClick={() =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "approvals",
                value: isSelected
                  ? approvals.filter((a: string) => a !== approval)
                  : [...approvals, approval],
              }),
            )
          }
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            isSelected
              ? "border-green-500 bg-green-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              disabled
              className="h-4 w-4 accent-green-600"
            />
            <span
              className={`text-sm font-medium ${
                isSelected ? "text-green-700" : "text-gray-700"
              }`}
            >
              {approval}
            </span>
          </div>
        </div>
      );
    })}
  </div>

  {/* ✅ Zod error message */}
  {showErrors && fieldErrors.approvals?.[0] && (
    <p className="text-xs text-red-500 mt-1">
      {fieldErrors.approvals[0]}
    </p>
  )}
</div>


      {/* Litigation */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Legal Litigation Status
          </p>
          <p className="text-xs text-gray-500">Indicate if litigation exists</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "No Litigation", value: false },
            { label: "Has Litigation", value: true },
          ].map((option) => {
            const isSelected =
              residential.litigation?.hasLitigation === option.value;

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() =>
                  dispatch(
                    setProfileField({
                      propertyType: "residential",
                      key: "litigation",
                      value: { hasLitigation: option.value },
                    }),
                  )
                }
                className={`p-4 rounded-lg border-2 ${
                  isSelected
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    isSelected ? "text-green-700" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={() => {
          console.log("🟢 Verify submit clicked");

          setShowErrors(true);

          console.log("📦 Residential state (verify):", residential);

          // ✅ ONLY verify-step validation
          const result = validateResidentialVerify(residential);

          console.log("🧪 Verify validation result:", result);

          if (!result.success) {
            console.error("❌ Verify validation failed");
            console.table(result.error.flatten().fieldErrors);
            toast.error("Please fix verification details");
            return;
          }

          console.log("🚀 Verification passed. Submitting to API");

          dispatch(
            submitVerificationThunk({
              category: propertyType,
              id: draftId,
              payload: residential, // ✅ ORIGINAL state
            }),
          )
            .unwrap()
            .then((response) => {
              console.log("✅ API success response:", response);
              toast.success("Property verified successfully");

              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });

              router.push("/my-properties");
            })
            .catch((error: any) => {
              console.error("🔥 API error:", error);
              toast.error(error?.message || "Failed to submit property");
            });
        }}
        className="btn-primary w-full py-2 rounded-md text-white"
      >
        Submit Property
      </button>
    </div>
  );
};

export default VerifyResidential;
