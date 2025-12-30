import Stepper from "./Stepper";
import { ArrowDropdownIcon } from "@/icons/icons";

export default function Sidebar() {
  return (
    <aside className="p-2">
      <div
        className="rounded-xl border p-4 space-y-6 border-[#EBECF0]"
        style={{
          background:
            "linear-gradient(175.36deg, #DDF2E7 2.5%, #F3FBF7 45%, #FFFFFF 85%)",
        }}
      >
        {/* Go Back */}
        <button className="text-sm text-[#8F8F8F] flex items-center py-1.5">
          <ArrowDropdownIcon
            size={12}
            color="#8F8F8F"
            className="transition-transform duration-200 rotate-90"
          />
          &nbsp; Go back
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
              className="h-2 bg-green-500 rounded-full"
              style={{ width: "5%" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">5%</p>
        </div>

        {/* Stepper */}
        <Stepper />

        {/* Help Box */}
        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg text-sm border border-[#EBECF0]">
          Need help? Now you can directly post property via{" "}
          <span className="text-green-600 font-medium">Whatsapp</span>
        </div>
      </div>
    </aside>
  );
}
