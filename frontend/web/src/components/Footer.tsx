// app/components/Footer.tsx
"use client";

import Logo from "@/animations/Logo";
import { AppStoreBadge, FacebookSVG, InstagramSVG, LinkedInSVG, PlayStoreBadge, TwitterSVG, YouTubeSVG } from "@/icons/icons";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#F4FBF6] text-gray-800">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + Social */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 group">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6">
                    <Logo />
                  </div>
                  <span className="text-2xl text-primary font-medium relative">
                    PROPENU
                    <sup className="text-[10px] font-normal ml-0.5 align-super text-[#646464]">
                      TM
                    </sup>
                  </span>
                </div>
              </span>
             
            </Link>

            <div className="mt-6 flex items-center gap-4">
              {/* Social icons */}
              <SocialIcon label="Facebook" href="#" svg={<FacebookSVG />} />
              <SocialIcon label="Instagram" href="#" svg={<InstagramSVG />} />
              <SocialIcon label="LinkedIn" href="#" svg={<LinkedInSVG />} />
              <SocialIcon label="YouTube" href="#" svg={<YouTubeSVG />} />
              <SocialIcon label="Twitter/X" href="#" svg={<TwitterSVG />} />
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Propenu</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="hover:text-emerald-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-600">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="hover:text-emerald-600">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-600">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Certifications */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Certifications</h3>

            {/* RERA card */}
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-700">
                <ShieldCheckSVG />
                RERA Approved
              </div>
              <p className="text-xs text-gray-500">Registration No.</p>
              <p className="text-sm font-semibold tracking-wide">
                PR0J80027845
              </p>
            </div>

            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <TickSVG />
                <span>ISO 9000:2332 Certified</span>
              </li>
              <li className="flex items-start gap-2">
                <TickSVG />
                <span>IGBC Gold Certified</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact Us</h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Toll Free – 1800 41 99099</p>
                <p className="text-gray-600">9:30 AM to 6:30 PM (Mon–Sun)</p>
              </div>

              <div>
                <p className="text-gray-600">Email –</p>
                <Link
                  href="mailto:propenusolutions@gmail.com"
                  className="font-medium hover:text-emerald-600 break-all"
                >
                  propenusolutions@gmail.com
                </Link>
              </div>

              <div>
                <p className="mb-2 text-gray-600">Download the App</p>
                <div className="flex items-center gap-3">
                  <AppStoreBadge />
                  <PlayStoreBadge />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider + bottom note (optional) */}
        <div className="mt-10 border-t border-emerald-100 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Propenu. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ---------- Small helper component for social links ---------- */
function SocialIcon({
  href,
  label,
  svg,
}: {
  href: string;
  label: string;
  svg: React.ReactNode;
}) {
  return (
    <Link
      aria-label={label}
      href={href}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 transition hover:scale-105 hover:ring-emerald-300"
    >
      <span className="h-5 w-5 text-gray-700">{svg}</span>
    </Link>
  );
}

/* ---------- Inline SVGs (no external deps) ---------- */


function ShieldCheckSVG() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function TickSVG() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 flex-none text-emerald-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
