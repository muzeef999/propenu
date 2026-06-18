"use client";

import Link from "next/link";
import { Suspense } from "react";
import { hexToRGBA } from "@/ui/hexToRGBA";
import MainContent from "./MainContent/MainContent";
import Sidebar from "./Sidebar/Sidebar";
import PostPropertiesHouse from "@/svg/PostPropertiesHouse";
import Logo from "@/animations/Logo";

const Page = () => {
  const bgPriceColor = hexToRGBA("#27AE60", 0.12);

  return (
    <div
      style={{ background: bgPriceColor }}
      className="relative min-h-screen w-full pb-10 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:pb-3"
    >
      <header className="mx-auto w-full max-w-5xl shrink-0 px-4 py-3 md:px-6 lg:px-2 lg:pt-1">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex select-none items-center gap-2 sm:gap-3"
            aria-label="Go to homepage"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7">
              <Logo />
            </div>

            <span className="text-base font-semibold tracking-tight text-primary sm:text-lg lg:text-xl">
              PROPENU
              <sup className="ml-0.5 align-super text-[8px] sm:text-[10px] font-normal text-[#646464]">
                TM
              </sup>
            </span>
          </Link>

          {/* Decorative SVG */}
          <div className="hidden lg:block">
            <PostPropertiesHouse className="w-[200px] xl:w-[260px] h-auto" />
          </div>
        </div>
      </header>

      {/* 🔹 Main Card Container */}
      <main className="relative z-20 mx-auto w-full max-w-5xl overflow-hidden bg-white shadow-xl lg:min-h-0 lg:flex-1 lg:rounded-xl">
       
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[280px_1fr]">
          
          <Sidebar />

          {/* Main Content */}
          <div className="min-h-0 overflow-y-auto [-webkit-overflow-scrolling:touch] lg:p-0">
            <Suspense fallback={null}>
              <MainContent />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;
