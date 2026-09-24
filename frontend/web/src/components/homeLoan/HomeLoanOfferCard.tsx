"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import HomeLoanApplyDialog from "./HomeLoanApplyDialog";

import {
  LoanOffer,
  loanOffers,
  filterItems,
  repeatedOffers,
  topLoanOffers,
} from "./homeLoanData";

export type { LoanOffer };
export { loanOffers, filterItems, repeatedOffers, topLoanOffers };

export default function LoanOfferCard({ offer }: { offer: LoanOffer }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  const openApplyModal = () => {
    setIsModalOpen(false);
    setIsApplyModalOpen(true);
  };

  return (
    <>
      <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={offer.logo}
              alt={`${offer.bankName} logo`}
              className={`object-contain ${offer.logoClass || "h-5 w-5"}`}
            />
          </span>
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {offer.bankName}
          </h3>
        </div>

        <div className="my-4 h-px bg-gray-100" />

        <dl className="grid grid-cols-4 gap-2 text-[10px] text-gray-500">
          <div>
            <dt>Loan Amount</dt>
            <dd className="mt-1 text-xs font-bold text-gray-950">
              {"\u20B9"} {offer.loanAmount}
            </dd>
          </div>
          <div>
            <dt>Interest</dt>
            <dd className="mt-1 text-xs font-bold text-gray-950">
              {offer.interest}
            </dd>
          </div>
          <div>
            <dt>Tenure</dt>
            <dd className="mt-1 text-xs font-bold text-gray-950">
              {offer.tenure}
            </dd>
          </div>
          <div>
            <dt>Monthly EMI</dt>
            <dd className="mt-1 text-xs font-bold text-gray-950">
              {"\u20B9"} {offer.monthlyEmi}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-4 inline-flex text-xs font-semibold text-[#27AE60] underline underline-offset-2 hover:text-[#219653] cursor-pointer"
        >
          Processing Fees
        </button>

        <button
          type="button"
          onClick={openApplyModal}
          className="mt-3 w-full rounded-md bg-[#27AE60] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#219653]"
        >
          Apply Now
        </button>
      </article>

      {/* Processing Fees Dialog Modal */}
      {isModalOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/45 transition-opacity"
            onClick={() => setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`loan-dialog-title-${offer.bankName}`}
          >
            <div
              className="relative w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={offer.logo}
                      alt={`${offer.bankName} logo`}
                      className={`object-contain ${offer.logoClass || "h-5 w-5"}`}
                    />
                  </span>
                  <h3
                    id={`loan-dialog-title-${offer.bankName}`}
                    className="text-base font-semibold text-gray-900"
                  >
                    {offer.bankName}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close dialog"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Offer Details Box */}
              <div className="rounded-xl bg-[#F2FFF8] px-4 py-3.5 space-y-2.5 border border-emerald-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Loan Amount</span>
                  <span className="font-semibold text-gray-950">
                    {"\u20B9"} {offer.loanAmount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Interest</span>
                  <span className="font-semibold text-gray-950">
                    {offer.interest}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Tenure</span>
                  <span className="font-semibold text-gray-950">
                    {offer.tenure}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Monthly EMI</span>
                  <span className="font-semibold text-gray-950">
                    {"\u20B9"} {offer.monthlyEmi}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Processing Fee</span>
                  <span className="font-semibold text-gray-950">
                    {offer.processingFee || "\u20B9 0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Processing Time</span>
                  <span className="font-semibold text-gray-950">
                    {offer.processingTime || "15 Days"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">
                    Discount on Processing
                  </span>
                  <span className="font-semibold text-gray-950">
                    {offer.discountOnProcessing || "Yes"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Login Fee</span>
                  <span className="font-semibold text-gray-950">
                    {offer.loginFee || "\u20B9 1000"}
                  </span>
                </div>
              </div>

              {/* Bottom Apply Now Button */}
              <button
                type="button"
                onClick={openApplyModal}
                className="mt-4 w-full rounded-md bg-[#27AE60] hover:bg-[#219653] py-2.5 sm:py-3 text-center text-sm font-medium text-white transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                Apply Now
              </button>
            </div>
          </div>,
          document.body
        )}

      <HomeLoanApplyDialog
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        titleId={`apply-loan-title-${offer.bankName
          .replace(/\s+/g, "-")
          .toLowerCase()}`}
      />
    </>
  );
}
