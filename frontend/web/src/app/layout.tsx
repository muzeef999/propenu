import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientProviders from "@/app/clientLayout"; // client component – used inside <body>

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EstatePro | Property Management Made Simple",
  description:
    "Manage properties, tenants, leases, rent collection, and maintenance requests — all in one smart platform.",
  keywords: [
    "Real Estate",
    "Property Management",
    "Tenant Portal",
    "Rental Management",
    "Lease Management",
    "Real Estate Dashboard",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* Only head & body may be direct children of html */}
      <body className={`${poppins.variable} antialiased`}>
        {/* Providers must be inside <body>, not wrapping it */}
        <ClientProviders>
          <Navbar />
          {children}
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
