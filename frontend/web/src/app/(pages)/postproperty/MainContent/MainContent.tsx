import { useDispatch, useSelector } from "react-redux";
import StepRenderer from "./StepRenderer";
import { useAppSelector } from "@/Redux/store";

const MainContent = () => {
  const currentStep = useAppSelector((state) => state.postProperty.currentStep);

  const STEP_TITLES: Record<number, string> = {
    1: "Add Basic Details",
    2: "Add Location Details",
    3: "Add Property Details",
    4: "Verify & Publish",
  };

  return (
    <div className="bg-white p-3 lg:p-3 h-full overflow-y-auto">
      <div className="rounded-xl border p-4 border-[#EBECF0] space-y-6">
        {/* --- Enquiry Banner --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 border-b border-gray-50 sm:border-none">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold border-2 border-white">
                F
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-semibold border-2 border-white">
                A
              </div>
            </div>

            <p className="text-sm text-gray-800 leading-tight">
              <span className="font-semibold">Get 2 extra enquiries</span> if
              you list your property in
            </p>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-orange-400 text-white font-medium whitespace-nowrap">
            5:35
          </span>
        </div>

        {/* --- Title & Help Button --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
          <p className="text-xl md:text-2xl font-semibold text-gray-900">
            {STEP_TITLES[currentStep]}
          </p>

          <button className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:underline bg-green-50 md:bg-transparent p-2 md:p-0 rounded-lg w-fit">
            <span className="text-gray-700">Need help?</span>
            <span className="flex items-center gap-1">📞 Get a callback</span>
          </button>
        </div>

        {/* --- Form Content --- */}
        <div className="pt-2">
          <StepRenderer />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
