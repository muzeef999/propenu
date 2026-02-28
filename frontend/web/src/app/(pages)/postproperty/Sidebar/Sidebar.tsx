"use client";

import Stepper from "./Stepper";
import { ArrowDropdownIcon } from "@/icons/icons";
import { useDispatch, useSelector } from "react-redux";
import { prevStep } from "@/Redux/slice/postPropertySlice";

const TOTAL_STEPS = 4;

export default function Sidebar() {
  const dispatch = useDispatch();

  const { currentStep, progressPercent } = useSelector(
    (state: any) => state.postProperty
  );


  return (
    <>
      {/* Mobile and Tablet View: Shows only Progress Bar */}
      {/* Mobile and Tablet View: Shows Progress Bar + Back Button */}
      <div className="block lg:hidden w-full p-4 bg-white border-b border-[#EBECF0]">

        {/* Top Row */}
        <div className="flex items-center justify-between mb-2">

          {/* 🔙 Back Button */}
          <button
            disabled={currentStep === 1}
            onClick={() => dispatch(prevStep())}
            className={`flex items-center text-sm transition ${currentStep === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 active:scale-95"
              }`}
          >
            <ArrowDropdownIcon
              size={16}
              color="currentColor"
              className="rotate-90 mr-1"
            />
          </button>

          {/* Title */}
          <div className="text-center">
            <h2 className="font-medium text-base text-gray-900 leading-tight">
              Post your property
            </h2>
            <p className="text-[10px] text-gray-500">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
          </div>

          {/* Progress Percent */}
          <p className="text-xs font-semibold text-green-600">
            {progressPercent}%
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Laptop View: Full Sidebar with Stepper */}
      <aside className="hidden lg:block p-2 h-full">
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
            className={`flex items-center text-sm py-1.5 transition ${currentStep === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-[#8F8F8F] hover:text-gray-700 cursor-pointer"
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
            <p className="text-xs text-gray-500">Sell or rent your property</p>
          </div>

          {/* Progress */}
          <div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{progressPercent}%</p>
          </div>

          {/* Stepper - Hidden on mobile/tab via the parent 'hidden lg:block' container */}
          <Stepper />
        </div>
      </aside>
    </>
  );
}