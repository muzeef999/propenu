import React from "react";
import Image from "next/image";
import { HiOutlineBell } from "react-icons/hi2";
import CmgSoonSvg from "@/svg/CmgSoonSvg";

const Topselllingcomingsoon = () => {
  return (
    <section
      className="relative mt-4 min-h-[276px] overflow-hidden rounded-xl border border-[#d6efdf] px-6 py-7 shadow-sm sm:px-8 lg:px-10"
      style={{
        background:
          "linear-gradient(90deg, rgba(241, 252, 245, 0.84) 0%, rgba(255, 255, 255, 0.84) 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#27AE60]/25 via-[#27AE60]/10 to-transparent" />

      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 12% 18%, transparent 0 34px, rgba(39, 174, 96, 0.18) 35px, transparent 36px), radial-gradient(ellipse at 42% 55%, transparent 0 48px, rgba(39, 174, 96, 0.14) 49px, transparent 50px), radial-gradient(ellipse at 30% 12%, transparent 0 62px, rgba(39, 174, 96, 0.1) 63px, transparent 64px)",
          backgroundSize: "180px 90px, 260px 130px, 300px 160px",
        }}
      />

      <div className="relative z-10 grid min-h-[220px] items-center gap-6 lg:grid-cols-[240px_minmax(320px,1fr)_300px]">
        <div className="relative hidden h-[150px] lg:ml-6 lg:block">
          <Image
            src="/images/topselling.png"
            alt=""
            fill
            className="scale-[2.0] object-contain object-bottom translate-x-[2%] translate-y-[8%]"
            sizes="280px"
            priority={false}
          />
        </div>

        <div className="mx-auto max-w-[550px] text-center">
          <h3 className="text-[26px] font-semibold leading-tight text-[#1eae5f] sm:text-[30px]">
            Most In-Demand Properties Coming Up
          </h3>
          <p className="mx-auto mt-4 max-w-[590px] text-sm leading-6 text-gray-500 sm:text-base">
            We&apos;ll show properties that are getting the most attention from
            buyers and tenants.
          </p>

          <button
            type="button"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-[#27AE60] px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-[#219653]"
          >
            <HiOutlineBell className="h-4 w-4" />
            Get Notified
          </button>
        </div>

        <div className="pointer-events-none relative hidden min-h-[220px] sm:block">
          <CmgSoonSvg
            aria-hidden="true"
            className="absolute -bottom-7 -right-24 h-[290px] w-[500px] max-w-none object-contain object-bottom opacity-50 scale-[1.2] translate-x-[-10%] translate-y-[10%]"
          />
          <Image
            src="/images/coupleimg.png"
            alt=""
            fill
            className="z-10 object-contain object-bottom scale-[1.4] translate-x-[10%] translate-y-[10%]"
            sizes="320px"
          />
        </div>
      </div>
    </section>
  );
};

export default Topselllingcomingsoon;
