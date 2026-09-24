"use client";

import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

interface FaqItem {
  question: string;
  answer: string;
}

const homeLoanFaqs: FaqItem[] = [
  {
    question: "How much home loan can I be eligible for?",
    answer:
      "Your home loan eligibility depends on multiple factors including your monthly net income, age, credit score (CIBIL), existing financial liabilities (EMIs), loan tenure, and property valuation. Lenders typically allow your total monthly EMIs (including the new loan) to be up to 50%–60% of your net monthly income.",
  },
  {
    question: "What documents are required to apply for a home loan?",
    answer:
      "Common documents include proof of identity (Aadhaar, PAN card, Passport), proof of address, income documents (last 3-6 months' salary slips, Form 16, last 6 months' bank statements; or audited balance sheets/ITR for self-employed individuals), and property documents (sale agreement, title deeds, approved building plan, and NOC from the builder/society).",
  },
  {
    question: "What is the difference between fixed and floating interest rates?",
    answer:
      "A fixed interest rate remains unchanged throughout the loan tenure (or a specified lock-in period), ensuring constant monthly EMIs regardless of market fluctuations. A floating interest rate is tied to an external benchmark (such as the RBI repo rate) and fluctuates according to market changes, which can increase or decrease your EMI over time.",
  },
  {
    question: "Can I prepay or foreclose my home loan without penalty?",
    answer:
      "As per Reserve Bank of India (RBI) guidelines, banks and housing finance companies cannot charge prepayment penalties or foreclosure charges on floating-rate home loans sanctioned to individual borrowers. Fixed-rate home loans may attract a nominal charge depending on the lender's policy.",
  },
  {
    question: "What tax benefits can I claim on a home loan?",
    answer:
      "Borrowers can claim tax deductions under Section 80C for principal repayment up to ₹1.5 Lakh per financial year, and under Section 24(b) for interest payment up to ₹2 Lakh for self-occupied properties. Additional benefits may apply for first-time homebuyers under applicable sections.",
  },
  {
    question: "How long does it take for a home loan to get approved and disbursed?",
    answer:
      "Initial in-principle approval or sanction letter is usually issued within 2 to 5 business days after document verification. Complete legal and technical verification of the property typically takes 7 to 15 business days, after which disbursement takes place once agreements are executed.",
  },
];

export default function HomeLoanFaqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="w-full bg-[#F9FBFD] py-12 sm:py-16 border-t border-gray-100">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500">
              Clear answers to the most common questions about home loan eligibility, documentation, and processes.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {homeLoanFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.question}
                  className="rounded-xl border border-gray-200/80 bg-white transition-all duration-200 shadow-xs hover:border-emerald-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-semibold text-gray-900">
                      {faq.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#27AE60] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <FiChevronDown size={18} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-gray-50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
