import React from "react";
import Link from "next/link";
import LoanOfferCard from "./HomeLoanOfferCard";
import { filterItems, repeatedOffers } from "./homeLoanData";

export default function HomeLoanAllOffers() {
  return (
    <section className="w-full bg-[#FBFCFC] py-12 sm:py-16">
      <div className="container mx-auto">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
              Home Loan Offers
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-900">
            <span className="text-[#27AE60]">15</span> Bank Offers Found
          </p>
        </div>

        <div className="grid grid-cols-1 gap-20 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.08)]">
            <h2 className="text-base font-semibold text-gray-950">Filters</h2>
            <div className="mt-5 divide-y divide-gray-100">
              {filterItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-gray-600"
                >
                  <span>{item}</span>
                  <span className="h-2 w-2 rotate-45 border-b border-r border-gray-400" />
                </button>
              ))}
            </div>
          </aside>

          <div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {repeatedOffers.map((offer, index) => (
                <LoanOfferCard
                  key={`${offer.bankName}-${index}`}
                  offer={offer}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
