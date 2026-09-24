import React from "react";
import type { Metadata } from "next";
import HomeLoanHero from "@/components/homeLoan/HomeLoanHero";
import BankMarquee from "@/components/homeLoan/BankMarquee";
import HomeLoanCalculator from "@/components/homeLoan/HomeLoanCalculator";
import HomeLoanOffers from "@/components/homeLoan/HomeLoanOffers";
import HomeLoanArticles from "@/components/homeLoan/HomeLoanArticles";
import HomeLoanFaqs from "@/components/homeLoan/HomeLoanFaqs";

export const metadata: Metadata = {
  title: "Home Loans - Easy Financing & EMI Calculator | Propenu",
  description:
    "Explore the right home-loan options, check your eligibility, calculate your EMI, and get expert guidance through every step—from application to approval.",
};

export default function HomeLoansPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section with Empty Banner Space */}
      <HomeLoanHero />

      {/* Bank Logos Marquee */}
      <BankMarquee />

      {/* Home Loan Eligibility & EMI Calculator */}
      <HomeLoanCalculator />

      {/* Home Loan Offers and Journey */}
      <HomeLoanOffers />

      {/* Home Loan Articles & FAQs */}
      <HomeLoanArticles />
      <HomeLoanFaqs />
    </main>
  );
}
