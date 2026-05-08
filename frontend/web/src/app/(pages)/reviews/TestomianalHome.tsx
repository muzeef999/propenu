"use client";
import TestimonialCardsMarquee from "./TestmonialVideosHome";
import { BiCheckShield } from "react-icons/bi"; // Importing a shield icon

const TestomianalHome = () => {
  return (
    <section className="overflow-hidden py-6 sm:py-8 lg:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h2 className="text-[34px] font-semibold leading-tight tracking-tight text-black sm:text-5xl md:text-6xl">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 lg:justify-start lg:gap-x-4">
                <span>Fuelling</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] rotate-[-23deg] sm:h-14 sm:w-14 sm:rounded-2xl md:h-16 md:w-16">
                  <BiCheckShield className="text-3xl text-[#22C55E] sm:text-4xl md:text-[170px]" />
                </div>
                <span>Growth</span>
              </div>
              <span className="mt-1 block sm:mt-2">with every click</span>
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 sm:mt-6 sm:max-w-lg sm:text-lg md:text-md">
              Every click brings you closer to your home
            </p>
          </div>
          <div className="relative mt-2 flex w-full justify-center lg:mt-0 lg:justify-end">
            <div className="absolute left-1/2 top-1/2 -z-10 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl sm:h-[300px] sm:w-[300px]" />
            <TestimonialCardsMarquee />
          </div>

        </div>
        {/* <div className="mt-20">
          <ClientStories />
        </div> */}

      </div>
    </section>
  );
};

export default TestomianalHome;
