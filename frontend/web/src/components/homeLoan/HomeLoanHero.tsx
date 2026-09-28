"use client";

import React from "react";
import Link from "next/link";

interface HomeLoanHeroProps {
  /**
   * Optional custom banner element or image.
   * If not provided, a styled empty banner slot is displayed.
   */
  bannerSlot?: React.ReactNode;
}

export default function HomeLoanHero({ bannerSlot }: HomeLoanHeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#F2FAF5] via-[#F8FCFA] to-white pt-10 sm:pt-14 lg:pt-16 pb-12 sm:pb-16">
      {/* Decorative Topographic / Wave Contour Background */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-45 overflow-hidden">
        <svg
          className="absolute -top-12 left-0 w-full h-full min-w-[1000px]"
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50,160 C300,120 600,260 900,160 C1200,60 1350,190 1500,140"
            stroke="#86EFAC"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            fill="none"
          />
          <path
            d="M-50,220 C280,180 580,320 880,220 C1180,120 1380,260 1500,200"
            stroke="#BBF7D0"
            strokeWidth="1.75"
            fill="none"
          />
          <path
            d="M-20,90 C320,50 620,190 920,90 C1220,-10 1380,110 1500,70"
            stroke="#86EFAC"
            strokeWidth="1.25"
            fill="none"
          />
          <path
            d="M-40,300 C260,250 560,400 860,300 C1160,200 1360,350 1500,280"
            stroke="#BBF7D0"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-60,380 C240,320 540,460 840,370 C1140,280 1340,420 1500,350"
            stroke="#86EFAC"
            strokeWidth="1.2"
            strokeDasharray="6 6"
            fill="none"
          />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Content */}
          <div className="flex flex-col items-start text-left lg:col-span-7">
            {/* Tag / Category */}
            <span className="text-sm sm:text-base font-bold text-gray-900 tracking-tight mb-3 sm:mb-4">
              Plan Your Home
            </span>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-extrabold text-[#16A34A] leading-[1.18] tracking-tight">
              Found a Home you Like?
              <br />
              Lets work out the Numbers.
            </h1>

            {/* Description */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-gray-500 sm:text-gray-600 leading-relaxed max-w-xl">
              Explore the right home-loan options, check your eligibility,
              calculate your EMI, and get expert guidance through every
              step—from application to approval.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3.5 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("calculator");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 sm:px-7 py-3 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-sm sm:text-base shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                Check Loan Eligibility
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("calculator");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 sm:px-7 py-3 rounded-lg border-2 border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A]/8 font-medium text-sm sm:text-base active:scale-[0.98] transition-all duration-200 cursor-pointer bg-transparent"
              >
                Calculate your EMI
              </button>
            </div>
          </div>

          {/* Right Column: Empty space for banner */}
          <div className="w-full lg:col-span-5 flex items-center justify-center">
            {bannerSlot ? (
              bannerSlot
            ) : (
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-w-md sm:max-w-lg lg:max-w-none min-h-[260px] sm:min-h-[340px] rounded-2xl border-2 border-dashed border-emerald-300/70 bg-white/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center transition-all hover:border-emerald-400 group">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-700">
                  Banner Space
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Empty space reserved for hero banner illustration or image
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
