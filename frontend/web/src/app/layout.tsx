import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./global.css";
import "leaflet/dist/leaflet.css";
import ClientProviders from "@/app/clientLayout"; // client component – used inside <body>
import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Propenu | Smart, Trusted & Verified Real Estate Platform",
  description:
    "Post your property on Propenu and sell smarter. Verified listings, genuine buyers, and a completely spam-free experience.",
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TJMKXQR5');`}
        </Script>

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </head>

      {/* Only head & body may be direct children of html */}
      <body
        suppressHydrationWarning
        className={`${poppins.variable} antialiased`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TJMKXQR5"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
