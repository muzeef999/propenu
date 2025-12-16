"use client";
import { hexToRGBA } from "@/ui/hexToRGBA";
import MainContent from "./MainContent/MainContent";
import Sidebar from "./Sidebar/Sidebar";

const page = () => {
  const bgPriceColor = hexToRGBA("#27AE60", 0.1);

  return (
    <div style={{ background: bgPriceColor }}>
      <div className="mx-auto max-w-5xl px-4">
        <div className="card p-2">
          <div className="grid grid-cols-[280px_1fr]">
            <Sidebar />
            <MainContent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
