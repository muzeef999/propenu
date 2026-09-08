"use client";

import Image from "next/image";
import heroBannerMobile from "@/asserts/propenu-hero-banner-for-moblie.jpeg";
import heroBannerwebp from "@/asserts/propenu-hero-web-banner.jpeg";
import { useEffect, useState } from "react";
import "./bannerStyle.css";
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
    <section className="relative w-full overflow-visible">
      {/* ================= DESKTOP ================= */}
      <div className="hidden md:block w-full relative md:h-[260px] xl:h-auto">
        <Image
          src={heroBannerwebp}
          alt="Propenu hero banner"
          priority
          sizes="100vw"
          className="h-full w-full object-cover xl:h-auto"
        />

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full md:w-[66%] px-6 py-6 md:px-10 lg:px-14 xl:py-10 space-y-2.5 xl:space-y-4">
            {/* <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-lg border border-[#27AE60]/30shadow-[0_8px_30px_rgba(39,174,96,0.18)]"
            >
              <IoHomeOutline className="w-4 h-4 text-[#27AE60]" />
              <span className="text-sm font-semibold text-[#27AE60] tracking-wide">
                Trusted Real Estate Platform
              </span>
            </div> */}

            <h1 className="text-2xl font-bold leading-tight text-neutral-600 lg:text-3xl xl:text-4xl">
              Are you looking for a happy home, <br />
              just like we did?
            </h1>
            <h3 className="text-base font-normal text-neutral-600 lg:text-lg xl:text-xl">
              Tired of fake listings and spam calls?
            </h3>

            <div className="flex h-10 items-center gap-2 overflow-hidden xl:h-[3.2rem] xl:gap-3">
              {/* check icon */}

              <p className="whitespace-nowrap text-sm text-slate-600 lg:text-base xl:text-lg">
                Introducing <span className="highlight-name-logo">PROPENU</span>
                .
              </p>
              {/* animated trust text */}
              <IoMdCheckmarkCircleOutline
                className="text-emerald-700 shrink-0"
                size={20}
              />
              <p
                key={index}
                className="final-text-line w-[190px] font-semibold tracking-wide text-emerald-700 animate-fadeSlide xl:w-[230px]"
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
              Are you looking for a happy home? just like we did?
            </h1>

            <h3 className="text-neutral-600 font-normal text-xl">
              Tired of fake listings and spam calls?
            </h3>

            <div className="h-[5.2rem] flex flex-col overflow-hidden">
              <p className="text-2xl">
                That's when we found{" "}
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
