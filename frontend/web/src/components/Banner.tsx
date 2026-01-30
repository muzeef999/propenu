"use client";

import Image from "next/image";
import heroBannerMobile from "@/asserts/propenu-hero-banner-for-moblie.jpeg";
import heroBannerwebp from "@/asserts/propenu-hero-web-banner.jpeg";
import { useEffect, useState } from "react";
import "./bannerStyle.css";
import { IoHomeOutline } from "react-icons/io5";
import SearchBox from "./SearchBox";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";

const TEXTS = [
  " Verified properties.",
  " Verified users.",
  " Zero spam.",
  " Secure transactions.",
];

const Banner = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TEXTS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full overflow-hidden">
      {/* ================= DESKTOP ================= */}
      <div className="hidden md:block w-full relative">
        <Image
          src={heroBannerwebp}
          alt="Propenu hero banner"
          priority
          sizes="100vw"
          className="w-full h-auto object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full md:w-[65%]  px-6 md:px-14 py-10 space-y-4">
            {/* Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#27AE60] backdrop-blur-md rounded-full w-fit shadow-sm">
              <IoHomeOutline className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white tracking-wide">
                Trusted Real Estate Platform
              </span>
            </div>

            <h1 className="text-neutral-600 font-bold text-4xl">
              Looking for a <span className="highlight-truly">better</span>{" "}
              property experience?
            </h1>
            <h3 className="text-neutral-600 font-normal text-xl">
              Tired of fake listings, spam calls, and wasted site visits?
            </h3>

            <div className="h-[3.2rem] flex items-center gap-3 overflow-hidden">
              {/* check icon */}

              <p className="text-slate-600 text-lg whitespace-nowrap">
                That’s why we built{" "}
                <span className="highlight-name-logo">PROPENU</span>.
              </p>
              {/* animated trust text */}
              <IoMdCheckmarkCircleOutline
                className="text-emerald-700 shrink-0"
                size={20}
              />
              <p
                key={index}
                className="text-emerald-700 font-semibold tracking-wide text-lg w-[230px] final-text-line animate-fadeSlide"
              >
                {TEXTS[index]}
              </p>

              {/* brand conclusion */}
            </div>

            <SearchBox />
          </div>
        </div>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="block md:hidden w-full relative">
        <Image
          src={heroBannerMobile}
          alt="Propenu hero banner mobile"
          priority
          sizes="100vw"
          className="w-full h-auto object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 flex items-start">
          <div className="w-full  px-5 py-8 space-y-3">
            <h1 className="text-neutral-600 font-bold  text-2xl">
              Looking for a <span className="highlight-truly">better</span>{" "}
              property experience?
            </h1>

            <h3 className="text-neutral-600 font-normal text-xl">
              Tired of fake listings, spam calls, and wasted site visits?
            </h3>

            <div className="h-[5.2rem] flex flex-col overflow-hidden">
              <p className="text-2xl">
                That’s why we built{" "}
                <span className="highlight-name-logo">PROPENU</span>.
              </p>
              {/* animated trust text */}
              <div className="flex items-center gap-2">
                <IoMdCheckmarkCircleOutline
                  className="text-emerald-700 shrink-0 animate-fadeSlide tracking-wide"
                  size={20}
                />
                <p
                  key={index}
                  className="text-emerald-700 font-semibold tracking-wide text-lg w-[230px] final-text-line animate-fadeSlide"
                >
                  {TEXTS[index]}
                </p>
              </div>
            </div>

            <SearchBox />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;