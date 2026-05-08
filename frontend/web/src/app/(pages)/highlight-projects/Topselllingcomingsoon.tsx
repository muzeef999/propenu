import React from "react";
import Image from "next/image";
import { HiOutlineBell } from "react-icons/hi2";
import CmgSoonSvg from "@/svg/CmgSoonSvg";

const Topselllingcomingsoon = () => {
  return (
    <section
      className="relative mt-4 min-h-[220px] overflow-hidden rounded-xl border border-[#d6efdf] px-4 py-5 shadow-sm sm:min-h-[246px] sm:px-6 sm:py-6 lg:min-h-[260px] lg:px-8"
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

      <div className="relative z-10 grid min-h-[180px] items-center gap-5 sm:min-h-[198px] lg:min-h-52 lg:grid-cols-[210px_minmax(300px,1fr)_260px]">
        <div className="relative hidden h-[130px] lg:ml-5 lg:block">
          <Image
            src="/images/topselling.png"
            alt=""
            fill
            className="scale-[1.8] object-contain object-bottom translate-x-[2%] translate-y-[8%]"
            sizes="240px"
            priority={false}
          />
        </div>

        <div className="mx-auto w-full max-w-[290px] text-center sm:max-w-[500px]">
          <h3 className="text-lg font-semibold leading-tight text-[#1eae5f] sm:text-[22px] lg:text-[26px]">
            Most In-Demand Properties Coming Up
          </h3>
          <p className="mx-auto mt-2.5 max-w-[280px] text-xs leading-5 text-gray-500 sm:mt-3 sm:max-w-[520px] sm:text-sm sm:leading-5 lg:text-[15px]">
            We&apos;ll show properties that are getting the most attention from
            buyers and tenants.
          </p>

          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-[#27AE60] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#219653] sm:mt-5 sm:h-10 sm:px-7 sm:text-sm"
          >
            <HiOutlineBell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Get Notified
          </button>
        </div>

        <div className="pointer-events-none relative hidden min-h-[198px] sm:block lg:min-h-52">
          <CmgSoonSvg
            aria-hidden="true"
            className="absolute -bottom-7 -right-24 h-[250px] w-[430px] max-w-none object-contain object-bottom opacity-50 scale-[1.15] translate-x-[-10%] translate-y-[10%]"
          />
          <Image
            src="/images/coupleimg.png"
            alt=""
            fill
            className="z-10 object-contain object-bottom scale-[1.25] translate-x-[10%] translate-y-[10%]"
            sizes="280px"
          />
        </div>
      </div>
    </section>
  );
};

export default Topselllingcomingsoon;
