import { hexToRGBA } from "@/ui/hexToRGBA";
import Stepper from "./Stepper";
import { ArrowDropdownIcon } from "@/icons/icons";

export default function Sidebar() {

  return (
    <aside className="bg-white  p-2">
      <div
        className="rounded-xl border p-4  border-[#EBECF0] space-y-6"
        style={{ backgroundColor: '#EBECF0' }}
      >
        <button className="text-sm  text-[#8F8F8F] flex  py-1.5 items-center">
          <ArrowDropdownIcon
            size={12}
            color="#8F8F8F"
            className={"transition-transform duration-200 rotate-90"}  />
          &nbsp; Go back
        </button>

        <div>
          <h2 className="font-regular text-xl">Post your property</h2>
          <p className="text-xs text-gray-500">Sell or rent your property</p>
        </div>

        <div>
          <div className="h-2 bg-gray-200 rounded">
            <div className="h-2 bg-green-500 rounded" style={{ width: "5%" }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">5%</p>
        </div>

        <Stepper />

        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          Need help? Now you can directly post property via
          <span className="text-green-600 font-medium"> Whatsapp</span>
        </div>
      </div>
    </aside>
  );
}
