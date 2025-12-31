"use client";

import Stepper from "./Stepper";
import { ArrowDropdownIcon } from "@/icons/icons";
import { useDispatch, useSelector } from "react-redux";
import { prevStep } from "@/Redux/slice/postPropertySlice";

const TOTAL_STEPS = 4;

export default function Sidebar() {
  const dispatch = useDispatch();
  const currentStep = useSelector(
    (state: any) => state.postProperty.currentStep
  );

  const progressPercent = Math.round(
    (currentStep / TOTAL_STEPS) * 100
  );

  return (
    <aside className="p-2 h-full">
      <div
        className="h-full rounded-xl border p-4 space-y-6 border-[#EBECF0]"
        style={{
          background:
            "linear-gradient(175.36deg, #DDF2E7 2.5%, #F3FBF7 45%, #FFFFFF 85%)",
        }}
      >
        {/* 🔙 Go Back */}
        <button
          disabled={currentStep === 1}
          onClick={() => dispatch(prevStep())}
          className={`flex items-center text-sm py-1.5 transition ${
            currentStep === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#8F8F8F] hover:text-gray-700"
          }`}
        >
          <ArrowDropdownIcon
            size={12}
            color="currentColor"
            className="rotate-90 mr-1"
          />
          Go back
        </button>

        {/* Header */}
        <div>
          <h2 className="font-normal text-xl text-gray-900">
            Post your property
          </h2>
          <p className="text-xs text-gray-500">
            Sell or rent your property
          </p>
        </div>

        {/* Progress */}
        <div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {progressPercent}%
          </p>
        </div>

        {/* Stepper */}
        <Stepper />

        {/* Help Box */}
        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg text-sm border border-[#EBECF0]">
          Need help? Now you can directly post property via{" "}
          <span className="text-green-600 font-medium cursor-pointer">
            WhatsApp
          </span>
        </div>
      </div>
    </aside>
  );
}
