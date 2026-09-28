import React from "react";
import type { Metadata } from "next";
import HomeLoanAllOffers from "@/components/homeLoan/HomeLoanAllOffers";
import { absoluteSiteUrl, DEFAULT_OG_IMAGE } from "@/utilies/siteUrl";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteSiteUrl("/home-loans/offers"),
  },
  openGraph: {
    title: "Home Loan Offers | Propenu",
    description:
      "Compare home loan offers from leading banks and review loan amount, interest, tenure, EMI, and processing fees.",
    url: absoluteSiteUrl("/home-loans/offers"),
    siteName: "Propenu",
    type: "website",
    images: [
      {
        url: absoluteSiteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: "Propenu home loan offers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home Loan Offers | Propenu",
    description:
      "Compare home loan offers from leading banks and review loan amount, interest, tenure, EMI, and processing fees.",
    images: [absoluteSiteUrl(DEFAULT_OG_IMAGE)],
  },
  title: "Home Loan Offers | Propenu",
  description:
    "Compare home loan offers from leading banks and review loan amount, interest, tenure, EMI, and processing fees.",
};

export default function HomeLoanOffersPage() {
  return (
    <main className="min-h-screen bg-[#FBFCFC]">
      <HomeLoanAllOffers />
    </main>
  );
}
