"use client";
import { useState } from "react";
import Logo from "@/animations/Logo";
import { useCity } from "@/hooks/useCity";
import { ArrowDropdownIcon } from "@/icons/icons";
import type { DropdownProps } from "@/ui/SingleDropDown";
import dynamic from "next/dynamic";
import CityDropdown from "./CityDropdown";
import Link from "next/link";

const Dropdown = dynamic<DropdownProps>(() => import("@/ui/SingleDropDown"), {
  ssr: false,
});

const BRAND_GREEN = "#27AE60"; // use your logo color

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const pPrimeItems = [
    { id: "pp-1", label: "Dashboard", href: "/prime/dashboard" },
    { id: "pp-2", label: "Analytics", href: "/prime/analytics" },
    { id: "pp-3", label: "Settings", href: "/prime/settings" },
  ];

  const loginItems = [
    { id: "lg-1", label: "Sign in", href: "/auth/signin" },
    { id: "lg-2", label: "Sign up", href: "/auth/signup" },
    { id: "lg-3", label: "Forgot password", href: "/auth/forgot" },
  ];

  return (
    <header className="sticky top-0 z-50">
      <nav
        className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-18 md:h-18 py-3">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-3 select-none"
                aria-label="Go to homepage"
              >
                <div className="w-7 h-7">
                  <Logo />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-semibold text-primary tracking-tight">
                    PROPENU
                    <sup className="ml-1 text-[10px] font-normal align-super text-[#646464]">
                      TM
                    </sup>
                  </span>
                </div>
              </Link>

              {/* City (desktop & tablet) */}
              <div
                aria-hidden="true"
                className="hidden md:flex items-center ml-2"
              >
                {/* CityDropdown is your existing component */}
                <CityDropdown />
              </div>
            </div>

            {/* RIGHT - desktop */}
            <div className="hidden md:flex items-center gap-6 text-[#1A1A1A]">
              <Dropdown
                buttonContent={({ isOpen }) => (
                  <span className="flex text-gray-700 items-center gap-2 text-sm py-1 px-0">
                    <span>p prime</span>
                    <ArrowDropdownIcon
                      size={14}
                      color={"#374151"}
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </span>
                )}
                items={pPrimeItems.map((it) => ({
                  ...it,
                  onClick: () =>
                    it.href ? (window.location.href = it.href) : undefined,
                }))}
                align="right"
              />

                   <span className="flex text-gray-700 items-center gap-2 text-sm py-1 px-0">
                    <span>Login</span>
                    <ArrowDropdownIcon
                      size={14}
                      color={"#374151"}
                    />
                  </span>

              {/* CTA - secondary outlined */}
              <Link href="/postproperty" className="btn btn-secondary">
                Post Property
                <span className="text-xs bg-[#27AE60] px-1 text-white rounded">
                  Free
                </span>
              </Link>
            </div>

            {/* mobile controls */}
            <div className="flex items-center md:hidden gap-3">
              {/* mobile city pill (compact) */}
              <div className="flex items-center">
                <div
                  aria-hidden="true"
                  className="px-2 py-1 rounded-md text-sm font-medium"
                >
                  <CityDropdown />
                </div>
              </div>

              <button
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((s) => !s)}
                className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                {/* simple hamburger/x */}
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {mobileOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <g>
                      <path d="M3 7h18" />
                      <path d="M3 12h18" />
                      <path d="M3 17h18" />
                    </g>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-[max-height] duration-200 ease-in-out overflow-hidden ${
            mobileOpen ? "max-h-[420px]" : "max-h-0"
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <nav className="flex flex-col gap-2">
              {/* p prime items (mobile as links) */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Prime
                </span>
                {pPrimeItems.map((it) => (
                  <Link
                    key={it.id}
                    href={it.href ?? "#"}
                    onClick={() => setMobileOpen(false)}
                    className="py-2 px-2 rounded-md text-sm font-medium hover:bg-gray-50"
                  >
                    {it.label}
                  </Link>
                ))}
              </div>

              {/* login */}
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Account
                </span>
                {loginItems.map((it) => (
                  <Link
                    key={it.id}
                    href={it.href ?? "#"}
                    onClick={() => setMobileOpen(false)}
                    className="py-2 px-2 rounded-md text-sm font-medium hover:bg-gray-50"
                  >
                    {it.label}
                  </Link>
                ))}
              </div>

              {/* post property CTA */}
              <div className="mt-3">
                <Link
                  href="/postproperty"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold border"
                  style={{
                    color: BRAND_GREEN,
                    borderColor: BRAND_GREEN,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  Post Property
                  <span
                    className="text-xs font-semibold rounded-md inline-flex items-center justify-center px-2 py-0.5"
                    style={{ background: BRAND_GREEN, color: "#fff" }}
                  >
                    Free
                  </span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
