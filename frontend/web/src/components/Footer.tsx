"use client";

import Logo from "@/animations/Logo";
import {
  AppStoreBadge,
  FacebookSVG,
  InstagramSVG,
  LinkedInSVG,
  PlayStoreBadge,
  TwitterSVG,
  YouTubeSVG,
} from "@/icons/icons";
import Link from "next/link";
import BuildingFooterSvg from "../svg/BuildingFooterSvg";

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden pt-8 pb-0 text-gray-800 sm:pt-10 lg:pt-12"
      style={{
        background: "linear-gradient(180deg, #27AE60 -337.72%, #FBFFFD 38.63%)",
      }}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {/* 1. Company Column */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-gray-900">
              Company
            </h3>
            <ul className="space-y-4 text-sm text-gray-700 font-medium">
              <li>
                <Link href="/about" className="hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/safety-guide" className="hover:text-primary">
                  Safety Guide
                </Link>
              </li>
              <li>
                <Link href="/help-center" className="hover:text-primary">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* 2. Contact Us Column */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-gray-900">
              Contact Us
            </h3>
            <div className="space-y-5 text-sm text-gray-700 font-medium">
              <div>
                <p>Helpline – +91 9182334233</p>
                <p className="text-gray-500 font-normal">
                  9:30 AM to 6:30 PM (Mon–Sun)
                </p>
              </div>
              <div>
                <p>Email – contact@propenu.com</p>
              </div>
              <div>
                <p className="font-medium">Registered Office</p>
                <p className="leading-relaxed text-gray-700">
                  # 193, 3rd Floor, SV Chambers,
                  <br />
                  Kavuri Hills, Madhapur,
                  <br />
                  Hyderabad – 500081, Telangana, India
                </p>
              </div>
            </div>
          </div>

          {/* 3. App Download Column */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-gray-900 text-center">
              Experience Propenu on Mobile
            </h3>
            <div className="flex flex-col gap-4 items-center">
              <div className="flex flex-col items-center justify-center gap-4 mt-2">
                <div className="rounded-xl border border-emerald-100 bg-white p-1 shadow-sm ring-4 ring-white/60">
                  <img
                    src="/images/qr.png"
                    alt="QR Code"
                    className="h-38 w-38 rounded-md object-cover"
                  />
                </div>
                <p className="text-[12px] text-gray-600 leading-snug text-center">
                  Scan the QR code to
                  <br /> Download the App
                </p>
              </div>
            </div>
          </div>

          {/* 4. Follow Us Column */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-gray-900">
              Follow Us
            </h3>
            <div className="flex items-center gap-3 mb-8">
              {/* LinkedIn */}
              <Link
                href="https://www.linkedin.com/company/propenu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm transition hover:shadow-md hover:bg-[#0A66C2] group"
              >
                <span className="w-7 h-7 text-[#0A66C2] group-hover:text-white transition">
                  <LinkedInSVG />
                </span>
              </Link>

              {/* Instagram */}
              <Link
                href="https://www.instagram.com/propenu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 hover:shadow-md group hover:bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)]">
                <span className="w-6 h-6">
                  <InstagramSVG />
                </span>
              </Link>

              {/* Facebook */}
              <Link
                href="https://www.facebook.com/profile.php?id=61584609591479"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm transition hover:shadow-md hover:bg-[#1877F2] group"
              >
                <span className="w-7 h-7 text-[#1877F2] group-hover:text-white transition">
                  <FacebookSVG />
                </span>
              </Link>

              {/* Twitter / X */}
              <Link
                href="https://x.com/propenu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm transition-all hover:shadow-md hover:bg-black group"
              >
                <span className="w-5 h-5 text-black group-hover:text-white transition-colors">
                  <TwitterSVG />
                </span>
              </Link>

              {/* YouTube */}
              <Link
                href="https://www.youtube.com/@Propenu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm transition hover:shadow-md hover:bg-[#FF0000] group"
              >
                <span className="w-6 h-6 text-[#FF0000] group-hover:text-white transition">
                  <YouTubeSVG />
                </span>
              </Link>
            </div>

            <div className="mt-6 flex flex-col items-start gap-4 max-lg:items-center max-lg:text-center lg:mt-8">
              <p className="text-xs leading-5 text-gray-500">
                © Copyright 2026 Propenu Solutions Pvt. Ltd
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <PlayStoreBadge />
                <AppStoreBadge />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Cityscape Svg */}
      <div className="pointer-events-none -mt-8 flex w-full items-end justify-center sm:-mt-7 lg:mt-0">
        <div className="flex w-full opacity-60">
          <BuildingFooterSvg />
        </div>
      </div>
    </footer>
  );
}
