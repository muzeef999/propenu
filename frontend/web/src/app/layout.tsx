import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
// import dynamic from "next/dynamic";

// const ClientLayout = dynamic(() => import("@/app/clientLayout"), { ssr: true });


const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"], // Customize as needed
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* <ClientLayout> */}
        <body className={`${poppins.variable} antialiased`}>
          <Navbar />
          {children}
        </body>
      {/* </ClientLayout> */}
    </html>
  );
}
