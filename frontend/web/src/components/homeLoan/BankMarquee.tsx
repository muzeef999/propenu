"use client";

import React from "react";

export interface BankPartner {
  name: string;
  logo: string;
  alt: string;
  imgClass?: string;
}

export const BANK_PARTNERS: BankPartner[] = [
  {
    name: "State Bank of India",
    logo: "/home-loan/sbi.png",
    alt: "SBI",
    imgClass: "h-7 sm:h-8 max-w-[130px]",
  },
  {
    name: "ICICI Bank",
    logo: "/home-loan/icici.png",
    alt: "ICICI Bank",
    imgClass: "h-9 sm:h-10 max-w-[110px]",
  },
  {
    name: "Kotak Mahindra Bank",
    logo: "/home-loan/kotak.png",
    alt: "Kotak Mahindra Bank",
    imgClass: "h-7 sm:h-8 max-w-[135px] rounded-[3px]",
  },
  {
    name: "Axis Bank",
    logo: "/home-loan/axis.png",
    alt: "Axis Bank",
    imgClass: "h-7 sm:h-8 max-w-[135px] rounded-[3px]",
  },
  {
    name: "HDFC Bank",
    logo: "/home-loan/hdfc.png",
    alt: "HDFC Bank",
    imgClass: "h-7 sm:h-8 max-w-[140px]",
  },
  {
    name: "Bank of Baroda",
    logo: "/home-loan/bob.png",
    alt: "Bank of Baroda",
    imgClass: "h-6.5 sm:h-7.5 max-w-[140px]",
  },
  {
    name: "YES Bank",
    logo: "/home-loan/yes.png",
    alt: "YES Bank",
    imgClass: "h-7 sm:h-8 max-w-[125px]",
  },
  {
    name: "Central Bank of India",
    logo: "/home-loan/central.png",
    alt: "Central Bank of India",
    imgClass: "h-7.5 sm:h-8.5 max-w-[135px]",
  },
];

export default function BankMarquee() {
  // Repeating 4 times so translateX(-50%) creates a seamless infinite marquee loop
  const marqueeItems = [
    ...BANK_PARTNERS,
    ...BANK_PARTNERS,
    ...BANK_PARTNERS,
    ...BANK_PARTNERS,
  ];

  return (
    <section className="relative w-full border-y border-gray-100 bg-white py-4 sm:py-5 overflow-hidden">
      {/* Left gradient fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-28 bg-gradient-to-r from-white to-transparent" />
      {/* Right gradient fade */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-28 bg-gradient-to-l from-white to-transparent" />

      {/* Marquee Track */}
      <div className="flex w-full overflow-hidden select-none">
        <div className="animate-marquee-scroll flex items-center">
          {marqueeItems.map((bank, index) => (
            <div
              key={`${bank.name}-${index}`}
              className="flex items-center justify-center px-6 sm:px-9 shrink-0 group"
            >
              <div className="h-10 sm:h-11 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bank.logo}
                  alt={bank.alt}
                  className={`w-auto object-contain transition-all duration-200 group-hover:scale-105 ${bank.imgClass || "h-8"}`}
                  loading={index < 8 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
