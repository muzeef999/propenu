"use client";
import { hexToRGBA } from "@/ui/hexToRGBA";
import MainContent from "./MainContent/MainContent";
import Sidebar from "./Sidebar/Sidebar";

const page = () => {
  const bgPriceColor = hexToRGBA("#27AE60", 0.1);

  return (
    <div
      style={{ background: bgPriceColor }}
      className="h-[105vh] w-full overflow-hidden flex items-center justify-center p-6"
    >
      <div className="w-full max-w-5xl h-full card bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="grid grid-cols-[280px_1fr] h-full">

            {/* Sidebar (fixed height, no scroll) */}
            <div className="h-full">
              <Sidebar />
            </div>

            {/* Main Content (scrolls) */}
            <div className="h-full overflow-y-auto">
              <MainContent />
            </div>

        </div>
      </div>
    </div>
  );
};

export default page;
