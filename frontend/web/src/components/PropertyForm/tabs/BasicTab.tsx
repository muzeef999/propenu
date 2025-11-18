// components/tabs/BasicTab.tsx
"use client";
import ToggleGroup from "@/ui/ToggleGroup";
import { useFormContext } from "react-hook-form";
import { FiTag } from "react-icons/fi";

type BasicTabProps = { 
  onNext: () => void; // 👈 receives the prop
};


export default function BasicTab({ onNext }: BasicTabProps) {
  const { register, watch,setValue, formState: { errors },} = useFormContext();
  const listingType = watch("listingType");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="space-y-4 flex-col card bg-[#F8FFFB] flex items-left justify-center">
        <h1 className="font-medium text-2xl">Fill out basic details</h1>
        <label>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
            <FiTag className="text-gray-500" />
            Title <span className="text-red-500">*</span>
          </label>

          <input
            {...register("title")}
            placeholder="e.g., 3BHK Apartment in Jubilee Hills"
            className="input-field"
          />
        </label>
        <label>
          Description
          <textarea
            {...register("description")}
            placeholder="Enter property details, highlights, and other important info..."
            className="input-field"
          />
        </label>
        <ToggleGroup
          label="Listing Type"
          options={[
            { label: "Sell", value: "Buy" },
            { label: "Rent / Lease", value: "Rent" },
          ]}
          value={listingType}
          onChange={(val) => setValue("listingType", val)}
          register={register("listingType")}
        />
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <div className="grid grid-cols-2 gap-3">
          {["Residential", "Commercial", "LandPlot", "Agricultural"].map(
            (option, index) => (
              <label
                key={option}
                className={"flex items-center gap-2 p-3  rounded-lg cursor-pointer transition-all duration-200  hover:border-green-400"}
              >
                <input
                  type="radio"
                  value={option}
                  {...register("category")}
                  defaultChecked={index === 0} // ✅ Residential pre-selected
                  className="appearance-none w-4 h-4 border-2 border-gray-400 rounded-full checked:border-green-500 checked:bg-green-500 relative before:content-[''] before:absolute before:inset-1 before:bg-white before:rounded-full before:scale-100"
                />
                <span className="text-gray-800 text-sm font-medium">
                  {option}
                </span>
              </label>
            )
          )}
        </div>
        {/* ✅ NEXT button at bottom */}
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onNext} className="btn btn-primary">
            Continue →
          </button>
        </div>
      </div>
      <div className="hidden md:flex items-center justify-center">
        <h1>Knowleadge guide details propority</h1>
      </div>
    </div>
  );
}
