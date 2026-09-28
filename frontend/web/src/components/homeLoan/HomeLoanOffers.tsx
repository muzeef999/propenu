"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDropdownIcon } from "@/icons/icons";
import LoanOfferCard from "./HomeLoanOfferCard";
import { topLoanOffers } from "./homeLoanData";

interface JourneyStep {
  title: string;
  description: string;
  bgClass: string;
  accentClass: string;
}

const journeySteps: JourneyStep[] = [
  {
    title: "Choose a Loan Offer",
    description:
      "Select a suitable home loan offer based on your requirements and preferred loan.",
    bgClass: "bg-emerald-50",
    accentClass: "bg-emerald-500",
  },
  {
    title: "Upload Documents",
    description:
      "Upload the required documents securely to complete the verification process smoothly.",
    bgClass: "bg-cyan-50",
    accentClass: "bg-cyan-500",
  },
  {
    title: "Submit Your Application",
    description:
      "Review your information carefully and submit your application for processing.",
    bgClass: "bg-pink-50",
    accentClass: "bg-pink-400",
  },
  {
    title: "Get Approval",
    description:
      "Track your application status and receive lender approval with expert support.",
    bgClass: "bg-blue-50",
    accentClass: "bg-indigo-500",
  },
];

function JourneyIllustration({ accentClass }: { accentClass: string }) {
  return (
    <div className="absolute bottom-0 right-4 h-20 w-20 rotate-12 rounded-lg bg-white/80 shadow-sm">
      <span
        className={`absolute left-1/2 top-3 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full ${accentClass}`}
      >
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
      <span className="absolute bottom-6 left-5 h-1.5 w-10 rounded-full bg-gray-700/60" />
      <span className="absolute bottom-3 left-4 h-1.5 w-12 rounded-full bg-gray-700/30" />
    </div>
  );
}

export default function HomeLoanOffers() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollControls = () => {
    const element = carouselRef.current;
    if (!element) return;

    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    const isLaptop = window.matchMedia("(min-width: 1024px)").matches;

    setCanScrollLeft(isLaptop && element.scrollLeft > 4);
    setCanScrollRight(isLaptop && element.scrollLeft < maxScrollLeft - 4);
  };

  const scrollOffers = (direction: "left" | "right") => {
    const element = carouselRef.current;
    if (!element) return;

    const scrollAmount = Math.max(element.clientWidth * 0.85, 280);

    element.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateScrollControls();

    const element = carouselRef.current;
    if (!element) return;

    element.addEventListener("scroll", updateScrollControls, { passive: true });
    window.addEventListener("resize", updateScrollControls);

    return () => {
      element.removeEventListener("scroll", updateScrollControls);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, []);

  return (
    <section className="w-full bg-white py-12 sm:py-16">
      <div className="container mx-auto space-y-14">
        {/* <div className="overflow-hidden rounded-2xl bg-[#F5FFFC] py-8 shadow-[0_2px_22px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-4 px-6 sm:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
              Your Top Home Loan Matches
            </h2>
            <Link
              href="/home-loans/offers"
              className="shrink-0 text-sm sm:text-base font-medium text-gray-900 transition-colors hover:text-[#27AE60]"
            >
              View More &gt;
            </Link>
          </div>

          <div className="relative mt-8 px-6 sm:px-10">
            <button
              type="button"
              aria-label="Scroll home loan offers left"
              onClick={() => scrollOffers("left")}
              disabled={!canScrollLeft}
              className="absolute left-2 sm:left-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md transition disabled:cursor-not-allowed disabled:opacity-0 lg:flex"
            >
              <ArrowDropdownIcon size={16} color="#26ad5f" className="rotate-90" />
            </button>

            <button
              type="button"
              aria-label="Scroll home loan offers right"
              onClick={() => scrollOffers("right")}
              disabled={!canScrollRight}
              className="absolute right-2 sm:right-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md transition disabled:cursor-not-allowed disabled:opacity-0 lg:flex"
            >
              <ArrowDropdownIcon size={16} color="#26ad5f" className="rotate-270" />
            </button>

            <div
              ref={carouselRef}
              className="no-scrollbar flex gap-6 overflow-x-auto scroll-smooth pt-2 pb-6 px-1"
              style={{ scrollbarWidth: "none" }}
            >
              {topLoanOffers.map((offer, index) => (
                <div
                  key={`${offer.bankName}-${index}`}
                  className="w-[290px] shrink-0 sm:w-[320px] lg:w-[calc((100%-4.5rem)/4)] "
                >
                  <LoanOfferCard offer={offer} />
                </div>
              ))}
            </div>
          </div>
        </div> */}

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
            Your Home Loan Journey in 4 Simple Steps
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {journeySteps.map((step) => (
              <article
                key={step.title}
                className={`relative min-h-32 overflow-hidden rounded-xl p-5 ${step.bgClass}`}
              >
                <h3 className="relative z-10 text-base font-semibold text-gray-950">
                  {step.title}
                </h3>
                <p className="relative z-10 mt-4 max-w-[72%] text-xs leading-relaxed text-gray-500">
                  {step.description}
                </p>
                <JourneyIllustration accentClass={step.accentClass} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
