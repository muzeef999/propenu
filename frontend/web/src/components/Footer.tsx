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
      className="relative text-gray-800 pt-12 pb-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #27AE60 -337.72%, #FBFFFD 38.63%)",
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 pb-24 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Company Column */}
          <div>
            <h3 className="mb-6 text-base font-semibold text-gray-900">Company</h3>
            <ul className="space-y-4 text-[14px] text-gray-700 font-medium">
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
                <Link href="/report" className="hover:text-primary">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-primary">
                  Safety Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* 2. Contact Us Column */}
          <div>
            <h3 className="mb-6 text-base font-semibold text-gray-900">
              Contact Us
            </h3>
            <div className="space-y-5 text-[14px] text-gray-700 font-medium">
              <div>
                <p>Help Line – 1800 41 99099</p>
                <p className="text-gray-500 font-normal">
                  9:30 AM to 6:30 PM (Mon–Sun)
                </p>
              </div>
              <div>
                <p>Email – contact@propenu.com</p>
              </div>
              <div>
                <p className="leading-relaxed">
                  Address – #191, 5th Floor,
                  <br />
                  Tagore Towers, Kavuri Hills Phase 2,
                  <br />
                  Hyderabad – 500033
                </p>
              </div>
            </div>
          </div>

          {/* 3. App Download Column */}
          <div>
            <h3 className="mb-6 text-base font-semibold text-gray-900">
              Experience Propenu App on Mobile
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <PlayStoreBadge />
                <AppStoreBadge />
              </div>
              <div className="flex items-start gap-4 mt-2">
                <div className="bg-white p-1 rounded-md shadow-sm border border-gray-100">
                  {/* Placeholder for QR Code */}
                  <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                    <span className="text-[10px] text-center">QR CODE</span>
                  </div>
                </div>
                <p className="text-[12px] text-gray-600 leading-snug">
                  Open camera &<br /> scan the QR code to
                  <br /> Download the App
                </p>
              </div>
            </div>
          </div>

          {/* 4. Follow Us Column */}
          <div>
            <h3 className="mb-6 text-base font-semibold text-gray-900">
              Follow Us
            </h3>
            <div className="flex items-center gap-3 mb-8">
              <Link
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition"
              >
                <span className="text-gray-700 w-7 h-7">
                  <LinkedInSVG />
                </span>
              </Link>

              <Link
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition"
              >
                <span className="text-gray-700 w-7 h-7">
                  <InstagramSVG />
                </span>
              </Link>

              <Link
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition"
              >
                <span className="text-gray-700 w-7 h-7">
                  <FacebookSVG />
                </span>
              </Link>

              <Link
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition"
              >
                <span className="text-gray-700 w-7 h-7">
                  <TwitterSVG />
                </span>
              </Link>

              <Link
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md transition"
              >
                <span className="text-gray-700 w-6 h-6">
                  <YouTubeSVG />
                </span>
              </Link>
            </div>

            <p className="text-[12px] text-gray-500 mt-10">
              © Copyright 2026 Propenu Solutions Pvt. Ltd
            </p>
          </div>
        </div>
      </div>

      {/* Background Cityscape Svg */}
      <div className="bottom-0 left-0 w-full flex items-end justify-center pointer-events-none">
        <div className="flex w-full opacity-60">
          <BuildingFooterSvg />
          <BuildingFooterSvg />
        </div>
      </div>
    </footer>
  );
}
