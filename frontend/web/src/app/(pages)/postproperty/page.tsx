"use client";

import { hexToRGBA } from "@/ui/hexToRGBA";
import MainContent from "./MainContent/MainContent";
import Sidebar from "./Sidebar/Sidebar";
import PostPropertiesHouse from "@/svg/PostPropertiesHouse";
import Image from "next/image";
import Logo from "@/animations/Logo";

const Page = () => {
  const bgPriceColor = hexToRGBA("#27AE60", 0.12);

  return (
    <div
      style={{ background: bgPriceColor }}
      className="relative min-h-screen w-full flex items-center justify-center p-6"
    >
      {/*logo image top leftside*/}
      {/* <div className="absolute top-6 left-6 z-10 w-[180px] h-[180px]">
        <Logo />
      </div> */}
      <div className="absolute top-6 right-29 z-10 hidden lg:block">
        <PostPropertiesHouse className="w-[260px] h-auto" />
      </div>

      {/* 🔹 Main Card */}
      <div className="relative z-20 w-full max-w-5xl h-[90vh] bg-white shadow-xl rounded-xl overflow-hidden mt-23">
        <div className="grid grid-cols-[280px_1fr] h-full">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="h-full overflow-y-auto">
            <MainContent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
