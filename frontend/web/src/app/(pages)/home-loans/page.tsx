import React from "react";
import type { Metadata } from "next";
import HomeLoanHero from "@/components/homeLoan/HomeLoanHero";
import BankMarquee from "@/components/homeLoan/BankMarquee";
import HomeLoanCalculator from "@/components/homeLoan/HomeLoanCalculator";
import HomeLoanOffers from "@/components/homeLoan/HomeLoanOffers";
import HomeLoanArticles from "@/components/homeLoan/HomeLoanArticles";
import HomeLoanFaqs from "@/components/homeLoan/HomeLoanFaqs";
import { absoluteSiteUrl, DEFAULT_OG_IMAGE } from "@/utilies/siteUrl";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteSiteUrl("/home-loans"),
  },
  openGraph: {
    title: "Home Loans - Easy Financing & EMI Calculator | Propenu",
    description:
      "Explore the right home-loan options, check your eligibility, calculate your EMI, and get expert guidance through every step from application to approval.",
    url: absoluteSiteUrl("/home-loans"),
    siteName: "Propenu",
    type: "website",
    images: [
      {
        url: absoluteSiteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: "Propenu home loans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home Loans - Easy Financing & EMI Calculator | Propenu",
    description:
      "Explore the right home-loan options, check your eligibility, calculate your EMI, and get expert guidance through every step from application to approval.",
    images: [absoluteSiteUrl(DEFAULT_OG_IMAGE)],
  },
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
