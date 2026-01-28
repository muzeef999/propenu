import { setProfileField } from "@/Redux/slice/postPropertySlice";
import { useAppDispatch } from "@/Redux/store";
import { submitVerificationThunk } from "@/Redux/thunks/submitPropertyApi";
import InputField from "@/ui/InputField";
import Toggle from "@/ui/ToggleSwitch";
import { validateCommercialVerify } from "@/zod/verificationZod/commercialVerifyZod";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const VerifyCommercial = () => {
  const { commercial, draftId, propertyType } = useSelector(
    (state: any) => state.postProperty,
  );
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showErrors, setShowErrors] = useState(false);
  const validationResult = validateCommercialVerify(commercial);

  const fieldErrors =
    showErrors && !validationResult.success
      ? validationResult.error.flatten().fieldErrors
      : {};

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            RERA Registration
          </p>
          <p className="text-xs text-gray-500">
            Enter your RERA registration number
          </p>
        </div>
        <InputField
          label="RERA Registration Number"
          placeholder="e.g. RERA2026HYD8899"
          value={commercial.reraRegistrationNumber || ""}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "commercial",
                key: "reraRegistrationNumber",
                value,
              }),
            )
          }
        />
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Approvals</p>
          <p className="text-xs text-gray-500">
            Select all applicable approvals
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["RERA", "HMDA", "GHMC", "RCC"].map((approval) => {
            const approvals = commercial.approvals || [];
            const isSelected = approvals.includes(approval);

            return (
              <div
                key={approval}
                onClick={() =>
                  dispatch(
                    setProfileField({
                      propertyType: "commercial",
                      key: "approvals",
                      value: isSelected
                        ? approvals.filter((a: string) => a !== approval)
                        : [...approvals, approval],
                    }),
                  )
                }
                className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected
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
                    className={`text-sm font-medium ${isSelected ? "text-green-700" : "text-gray-700"
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
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Compliance & Certificates
          </p>
          <p className="text-xs text-gray-500">
            Toggle applicable compliance details
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              label: "Fire NOC",
              enabled: commercial.fireNOC?.available || false,
              onChange: (val: boolean) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "fireNOC",
                    value: {
                      ...commercial.fireNOC,
                      available: val,
                    },
                  }),
                ),
            },
            {
              label: "Occupancy Certificate",
              enabled: commercial.occupancyCertificate?.available || false,
              onChange: (val: boolean) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "occupancyCertificate",
                    value: {
                      ...commercial.occupancyCertificate,
                      available: val,
                    },
                  }),
                ),
            },
            {
              label: "GST Registered",
              enabled: commercial.gstRegistered || false,
              onChange: (val: boolean) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "gstRegistered",
                    value: val,
                  }),
                ),
            },
            {
              label: "Property Tax Paid",
              enabled: commercial.propertyTaxPaid || false,
              onChange: (val: boolean) =>
                dispatch(
                  setProfileField({
                    propertyType: "commercial",
                    key: "propertyTaxPaid",
                    value: val,
                  }),
                ),
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-md border p-3 shadow-sm transition
        ${item.enabled
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-white"
                }`}
            >
              <span
                className={`text-sm font-medium ${item.enabled ? "text-green-700" : "text-gray-700"
                  }`}
              >
                {item.label}
              </span>

              <Toggle enabled={item.enabled} onChange={item.onChange} />
            </div>
          ))}
        </div>

      </div>

      <button
        type="button"
        onClick={() => {
          console.log("🟢 Verify submit clicked");

          setShowErrors(true);

          console.log("📦 Commercial state (verify):", commercial);

          // ✅ ONLY verify-step validation
          const result = validateCommercialVerify(commercial);

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
              payload: commercial, // ✅ ORIGINAL state
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

export default VerifyCommercial;
