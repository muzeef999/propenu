import React from "react";
import type { Metadata } from "next";
import HomeLoanAllOffers from "@/components/homeLoan/HomeLoanAllOffers";

export const metadata: Metadata = {
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
