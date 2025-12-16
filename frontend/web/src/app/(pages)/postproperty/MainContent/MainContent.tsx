import { useDispatch, useSelector } from "react-redux";
import StepRenderer from "./StepRenderer";
import { useAppSelector } from "@/Redux/store";

const MainContent = () => {
  const currentStep = useAppSelector(
  (state) => state.postProperty.currentStep
);

 const STEP_TITLES: Record<number, string> = {
  1: "Add Basic Details",
  2: "Add Location Details",
  3: "Add Property Details",
  4: "Verify & Publish",
};
  return (
    <div className="bg-white p-2">
      <div className="rounded-xl border p-4  border-[#EBECF0] space-y-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold border-2 border-white">
                F
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-semibold border-2 border-white">
                A
              </div>
            </div>

            <p className="text-sm text-gray-800">
              <span className="font-semibold">Get 2 extra enquiries</span> if
              you list your property in
            </p>

            <span className="text-xs px-2 py-1 rounded-full bg-orange-400 text-white font-medium">
              5:35
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between w-full gap-2 text-sm">
          <p className="text-lg font-semibold">{STEP_TITLES[currentStep]}</p>

          <button className="flex items-center gap-1 text-green-600 font-medium hover:underline">
            <span className="text-gray-700">Need help?</span> 📞 Get a callback
          </button>
        </div>

        <StepRenderer />

      </div>
    </div>
  );
};

export default MainContent;
