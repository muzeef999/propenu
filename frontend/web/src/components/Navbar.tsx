"use client";
import { useState, useEffect, useRef } from "react";
import Logo from "@/animations/Logo";
import { ArrowDropdownIcon, LocationIcon } from "@/icons/icons";
import type { DropdownProps } from "@/ui/SingleDropDown";
import dynamic from "next/dynamic";
import Link from "next/link";
import LoginDialog from "@/app/(auth)/Login";
import { me } from "@/data/ClientData";
import UserGreeting from "@/app/(auth)/UserGreeting";
import FilterDropdown from "@/ui/FilterDropdown";
import { useCity } from "@/hooks/useCity";
import { LocationItem } from "@/types";

const Dropdown = dynamic<DropdownProps>(() => import("@/ui/SingleDropDown"), {
  ssr: false,
});

const BRAND_GREEN = "#27AE60"; // use your logo color

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const data = await me();
      setUser(data);
    }
    fetchUser();
  }, []);

  const { selectedCity, locations, selectCity } = useCity();

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

  function onSelect(item: LocationItem) {
    selectCity(item);
    setOpen(false);
    btnRef.current?.focus();
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const popularCities = locations.filter(
    (loc) => loc.category?.toLowerCase() === "popular"
  );

  // Group cities by state
  const groupedByState = locations.reduce(
    (acc: Record<string, LocationItem[]>, loc) => {
      if (!acc[loc.state]) acc[loc.state] = [];
      acc[loc.state].push(loc);
      return acc;
    },
    {}
  );

  return (
    <header >
      <nav
        className="w-full bg-white/80 backdrop-blur-md border-b relative z-60 border-gray-200"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 ">
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
                <div>
                  <span className="text-lg sm:text-xl font-semibold text-primary tracking-tight">
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
                <div className="relative w-full md:w-auto">
                  <FilterDropdown
                    open={open}
                    onOpenChange={(next) => setOpen(next)}
                    triggerLabel={
                      <div className="flex gap-1 items-center justify-center">
                        <LocationIcon size={18} color="#27AE60" />
                        <span className="min-w-[90px] text-primary text-left">
                          {selectedCity?.city ?? "Select City"}
                        </span>
                        <ArrowDropdownIcon
                          size={12}
                          color="#27AE60"
                          className={`transition-transform duration-200 ${
                            open ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </div>
                    }
                    width="w-[90vw] max-w-[800px] z-90"
                    align="left"
                    renderContent={(close) => (
                      <div>
                        <h3 className="text-xl font-semibold text-black mb-1 mt-3  tracking-wide">
                          Popular cities
                        </h3>
                        <div className="flex flex-wrap text-primary">
                          {popularCities.map((i) => (
                            <div
                              onClick={() => {
                                onSelect(i);
                                close?.();
                              }}
                              className="flex flex-col text-gray-600 cursor-pointer px-3 py-2  items-center justify-between"
                            >
                              <div className="font-regular">{i.city}</div>
                            </div>
                          ))}
                          {Object.entries(groupedByState).map(
                            ([stateName, cities]) => (
                              <div key={stateName} className="w-full">
                                {/* State heading */}
                                <h3 className="text-xl font-semibold text-black mb-1 mt-3  tracking-wide">
                                  {stateName}
                                </h3>

                                {/* Cities under this state */}
                                {cities.map((c) => (
                                  <button
                                    key={c._id}
                                    onClick={() => {
                                      onSelect(c);
                                      close?.();
                                    }}
                                    role="menuitem"
                                  >
                                    <div className="flex flex-col text-gray-600 cursor-pointer px-3 py-2  items-center justify-between">
                                      <div className="font-regular">
                                        {c.city}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT - desktop */}
            <div className="hidden md:flex items-center gap-6 text-[#1A1A1A]">
              <Dropdown
                buttonContent={({ isOpen }) => (
                  <span className="flex text-gray-700 items-center gap-2 text-sm py-1 px-0">
                    <span>p prime</span>
                    <ArrowDropdownIcon
                      size={4}
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

              <>
                {!user ? (
                  <span
                    onClick={() => setIsLoginOpen(true)}
                    className="cursor-pointer text-sm text-gray-700"
                  >
                    Login
                  </span>
                ) : (
                  <UserGreeting user={user} />
                )}
              </>

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
              <div className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1.5 border border-gray-100">
                <LocationIcon size={14} color="#27AE60" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedCity?.city ?? "Select City"}
                </span>
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
                {user ? (
                  <div className="flex items-center gap-3 rounded-md bg-gray-50 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  loginItems.map((it) => (
                    <Link
                      key={it.id}
                      href={it.href ?? "#"}
                      onClick={() => setMobileOpen(false)}
                      className="py-2 px-2 rounded-md text-sm font-medium hover:bg-gray-50"
                    >
                      {it.label}
                    </Link>
                  ))
                )}
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
      {isLoginOpen && (
        <LoginDialog open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      )}
    </header>
  );
};

export default Navbar;
