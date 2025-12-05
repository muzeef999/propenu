"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download } from "@/icons/icons";

export type NavLink = {
  title: string;
  href: string;
};

type Props = {
  links?: NavLink[];
  // either a string URL ("/logo.png") or a StaticImageData-like object { src: string }
  logoUrl?: string | { src: string } | null;
  // hex color or CSS color string for icon / accents
  color?: string | null;
  // optional brochure URL to download when clicking the download icon
  brochureUrl?: string | null;
  // optional aria label for logo (defaults to "Site logo")
  logoAlt?: string;
};

export default function MicroSiteNavbar({
  links = [],
  logoUrl = "/logo.png",
  color = "#FFAC1D",
  brochureUrl,
  logoAlt = "Site logo",
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";

  // support both string URL or object with src
  const resolvedLogo =
    typeof logoUrl === "string"
      ? logoUrl
      : (logoUrl && (logoUrl as any).src) || "/logo.png";

  // safe color fallback
  const iconColor = typeof color === "string" && color.trim() !== "" ? color : "#FFAC1D";

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between">
          {/* logo */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src={resolvedLogo}
              alt={logoAlt}
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* desktop links + download icon */}
          <div className="hidden md:flex items-center">
            <ul className="flex items-center gap-6 text-sm font-medium text-slate-700">
              {links.map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={
                        "px-2 py-1 transition rounded " +
                        (active
                          ? "text-sky-600 underline underline-offset-4"
                          : "hover:text-sky-600")
                      }
                      aria-current={active ? "page" : undefined}
                    >
                      {l.title}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* download / brochure */}
            <div>
              {brochureUrl ? (
                <a
                  href={brochureUrl}
                  download
                  aria-label="Download brochure"
                  className="p-2 rounded hover:bg-slate-100 transition inline-flex items-center"
                >
                  <Download size={24} color={iconColor} />
                </a>
              ) : (
                <button
                  type="button"
                  aria-label="Download brochure"
                  title="No brochure available"
                  className="p-2 rounded hover:bg-slate-100 transition inline-flex items-center opacity-80"
                >
                  <Download size={24} color={iconColor} />
                </button>
              )}
            </div>
          </div>

          {/* mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="p-2 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                {open ? (
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* mobile menu */}
        {open && (
          <div className="md:hidden mt-1 pb-4">
            <ul className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-sky-600 transition"
                  >
                    {l.title}
                  </Link>
                </li>
              ))}

              {/* mobile download button shown in the menu too */}
              <li>
                {brochureUrl ? (
                  <a
                    href={brochureUrl}
                    download
                    className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-sky-600 transition flex items-center"
                  >
                    <Download size={18} color={iconColor} />
                    <span>Download Brochure</span>
                  </a>
                ) : (
                  <div className="block px-3 py-2 text-sm text-slate-500">Brochure not available</div>
                )}
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}