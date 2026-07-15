"use client";

import React from "react";
import { FiCalendar, FiClock, FiFileText, FiShield, FiUser } from "react-icons/fi";

const page = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-600">
          Dedicated Support
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Relationship Manager
        </h1>
        <p className="mt-3 max-w-4xl text-base leading-8 text-gray-500">
          Connect with your dedicated Relationship Manager for onboarding,
          personalized assistance, call scheduling, and issue resolution.
        </p>
      </div>

      <section className="rounded-[28px] bg-[#f4fffb] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex h-[180px] w-full max-w-[180px] shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#dff7ee] to-[#bfead7]">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#1ea764] shadow-sm">
                <FiUser className="h-12 w-12" />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h2 className="text-[32px] font-semibold leading-tight text-gray-900">
                  Rahul Sharma
                </h2>
                <p className="mt-2 text-[18px] text-gray-700">
                  Senior Relationship Manager
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d9f7e8] px-4 py-2 text-sm font-medium text-[#1ea764]">
                  <FiShield className="h-4 w-4" />
                  Your Dedicated Manager
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-base leading-8 text-gray-500">
                I&apos;m here to help you with onboarding, answer your
                questions, and ensure you have a smooth experience.
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-[320px] flex-col justify-between self-stretch lg:items-end">
            <div className="space-y-4 text-left lg:text-right">
              <div>
                <p className="inline-flex items-center gap-2 text-sm text-gray-500 lg:justify-end">
                  <FiClock className="h-4 w-4 text-[#1ea764]" />
                  Available Timings:
                  <span className="font-semibold text-gray-900">
                    11:00 AM - 6:00 PM
                  </span>
                </p>
              </div>

              <div>
                <p className="inline-flex items-center gap-2 text-sm text-gray-500 lg:justify-end">
                  <FiCalendar className="h-4 w-4 text-[#1ea764]" />
                  Response time:
                  <span className="font-semibold text-gray-900">
                    within 24 Hours
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex w-full flex-col gap-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#22c06f] bg-white px-4 py-3 text-base font-medium text-[#22c06f] transition hover:bg-[#f3fff8]"
              >
                <FiFileText className="h-4 w-4" />
                Raise a ticket
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22c06f] px-4 py-3 text-base font-medium text-white transition hover:bg-[#1cad63]"
              >
                <FiCalendar className="h-4 w-4" />
                Request a Call
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default page;
