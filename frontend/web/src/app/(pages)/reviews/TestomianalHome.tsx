"use client";

import React from "react";
// We don't need the arrow SVG anymore for this specific design based on your image
// import ArrowSvgTestominal from "@/svg/ArrowSvgTestominal"; 
import ClientStories from "./ClientStories";
import TestimonialCardsMarquee from "./TestmonialVideosHome";
import { BiCheckShield } from "react-icons/bi"; // Importing a shield icon

const TestomianalHome = () => {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

          <div className="flex flex-col items-start text-left">
            <h2 className="text-5xl md:text-6xl font-semibold leading-tight tracking-tight text-black">
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                <span>Fuelling</span>

                {/* The Floating Icon Box */}
                <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] rotate-[-23deg]">
                  <BiCheckShield className="text-4xl md:text-[170px] text-[#22C55E]" />
                </div>

                <span>Growth</span>
              </div>

              <span className="block mt-2">with every click</span>
            </h2>

            <p className="text-slate-500 text-lg md:text-md mt-6 max-w-lg leading-relaxed">
              They have awesome customer service. I wouldn't recommend going to anyone else. All of you guys are
            </p>
          </div>
          <div className="w-full flex justify-center lg:justify-end relative mt-10 lg:mt-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl -z-10" />

            <TestimonialCardsMarquee />
          </div>

        </div>
        <div className="mt-20">
          <ClientStories />
        </div>

      </div>
    </section>
  );
};

export default TestomianalHome;