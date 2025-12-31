"use client";

import Link from "next/link";
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
      className="relative min-h-[120vh] w-full"
    >
      <header className="mx-auto max-w-5xl px-4 pt-1 md:px-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex select-none items-center gap-3"
            aria-label="Go to homepage"
          >
            <div className="w-7 h-7">
              <Logo />
            </div>

            <span className="text-lg font-semibold tracking-tight text-primary sm:text-xl">
              PROPENU
              <sup className="ml-1 align-super text-[10px] font-normal text-[#646464]">
                TM
              </sup>
            </span>
          </Link>

          {/* Decorative SVG */}
          <div className="hidden lg:block">
            <PostPropertiesHouse className="w-[260px] h-auto" />
          </div>
        </div>
      </header>

      {/* 🔹 Main Card */}
      <div className="relative z-20 mx-auto h-screen w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
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
