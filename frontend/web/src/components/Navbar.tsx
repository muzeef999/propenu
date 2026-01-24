"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/animations/Logo";
import { ArrowDropdownIcon, LocationIcon } from "@/icons/icons";
import type { DropdownProps } from "@/ui/SingleDropDown";
import dynamic from "next/dynamic";
import Link from "next/link";
import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";
import { me } from "@/data/ClientData";
import UserGreeting from "@/app/(auth)/UserGreeting";
import FilterDropdown from "@/ui/FilterDropdown";
import { useCity } from "@/hooks/useCity";
import { LocationItem } from "@/types";

type AuthMode = "login" | "register" | null;

const Dropdown = dynamic<DropdownProps>(() => import("@/ui/SingleDropDown"), {
  ssr: false,
});

const BRAND_GREEN = "#27AE60"; // use your logo color

const Navbar = () => {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [open, setOpen] = useState(false);
  const [mobileOpen_city, setMobileOpen_city] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [openState, setOpenState] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const data = await me();
      setUser(data);
    }
    fetchUser();
  }, []);

  const toggleState = (stateName: string) => {
    setOpenState((prev) => (prev === stateName ? null : stateName));
  };


  const { selectedCity, locations, selectCity } = useCity();

  function onSelect(item: LocationItem) {
    selectCity(item);
    setOpen(false);
    setMobileOpen_city(false);
    btnRef.current?.focus();
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);

      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setMobileOpen_city(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setMobileOpen_city(false);
      }
    }
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const popularCities = locations.filter(
    (loc) => loc.category?.toLowerCase() === "popular",
  );

  // Group cities by state
  const groupedByState = locations.reduce(
    (acc: Record<string, LocationItem[]>, loc) => {
      if (!acc[loc.state]) acc[loc.state] = [];
      acc[loc.state].push(loc);
      return acc;
    },
    {},
  );
  const sortedGroupedByState = Object.entries(groupedByState)
    .sort(([stateA], [stateB]) => {
      // Selected state should come first
      if (stateA === selectedCity?.state) return -1;
      if (stateB === selectedCity?.state) return 1;
      return stateA.localeCompare(stateB);
    })
    .map(([stateName, cities]) => {
      // If this is the selected state, move selected city to top
      if (stateName === selectedCity?.state) {
        const sortedCities = [...cities].sort((a, b) => {
          if (a.city === selectedCity?.city) return -1;
          if (b.city === selectedCity?.city) return 1;
          return a.city.localeCompare(b.city);
        });

        return [stateName, sortedCities] as [string, LocationItem[]];
      }

      return [stateName, cities] as [string, LocationItem[]];
    });

  return (
    <header>
      <nav
        className="w-full bg-white/80 backdrop-blur-md border-b relative z-60 border-gray-200"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* LEFT */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link
                href="/"
                className="flex items-center gap-2 sm:gap-3 select-none shrink-0"
                aria-label="Go to homepage"
              >
                <div className="w-6 sm:w-7 h-6 sm:h-7 shrink-0">
                  <Logo />
                </div>
                <div className="">
                  <span className="text-base sm:text-lg lg:text-xl font-semibold text-primary tracking-tight">
                    PROPENU
                    <sup className="ml-1 text-[8px] sm:text-[10px] font-normal align-super text-[#646464]">
                      TM
                    </sup>
                  </span>
                </div>
              </Link>

              {/* City (desktop & tablet) */}
              <div
                aria-hidden="true"
                className="hidden lg:flex items-center ml-2"
                ref={rootRef}
              >
                <div className="relative w-full lg:w-auto">
                  <FilterDropdown
                    open={open}
                    onOpenChange={(next) => setOpen(next)}
                    triggerLabel={
                      <div className="flex gap-1 items-center justify-center">
                        <LocationIcon size={18} color="#27AE60" />
                        <span className="min-w-[90px] text-primary text-left truncate">
                          {selectedCity?.city ?? "Select City"}
                        </span>
                        <ArrowDropdownIcon
                          size={12}
                          color="#27AE60"
                          className={`transition-transform duration-200 shrink-0 ${open ? "rotate-180" : "rotate-0"
                            }`}
                        />
                      </div>
                    }
                    width="w-[90vw] max-w-[600px] z-999"
                    align="left"
                    renderContent={(close) => (
                      <div className="max-h-[80vh] overflow-y-auto">
                        <h3 className="font-semibold text-black mt-1 tracking-wide px-2">
                          Popular cities
                        </h3>
                        <div className="flex flex-wrap text-primary p-2 gap-2">
                          {popularCities.map((i) => (
                            <button
                              key={i._id}
                              onClick={() => {
                                onSelect(i);
                                close?.();
                              }}
                              className="flex flex-col text-gray-600 cursor-pointer px-2 py-1 items-center justify-center rounded hover:bg-gray-100 transition-colors"
                            >
                              <div className="text-xs">{i.city}</div>
                            </button>
                          ))}
                        </div>
                        {sortedGroupedByState.map(([stateName, cities]) => (
                          <div key={stateName} className="w-full px-2 mt-2">
                            <h3 className="font-semibold text-black text-sm tracking-wide">
                              {stateName}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {cities.map((c) => (
                                <button
                                  key={c._id}
                                  onClick={() => {
                                    onSelect(c);
                                    close?.();
                                  }}
                                  className="text-gray-600 cursor-pointer px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors"
                                >
                                  {c.city}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT - desktop */}
            <div className="hidden lg:flex items-center gap-4 lg:gap-6 text-[#1A1A1A] shrink-0">
              <>
                {!user ? (
                  <button
                    onClick={() => setAuthMode("login")}
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </button>
                ) : (
                  <UserGreeting user={user} />
                )}
              </>

              {/* CTA - secondary outlined */}
              <Link
                href="/postproperty"
                className="btn btn-secondary text-xs sm:text-sm whitespace-nowrap"
              >
                Post Property
                <span className="text-xs bg-[#27AE60] px-1 text-white rounded">
                  Free
                </span>
              </Link>
            </div>

            {/* mobile controls */}
            <div className="flex items-center lg:hidden gap-2 sm:gap-3 shrink-0">
              {/* mobile city pill (compact) */}
              <div ref={mobileDropdownRef} className="relative">
                <FilterDropdown
                  open={mobileOpen_city}
                  onOpenChange={(next) => setMobileOpen_city(next)}
                  triggerLabel={
                    <div className="flex items-center gap-1">
                      <LocationIcon size={14} color="#27AE60" />
                      <span className="font-medium text-gray-700 truncate max-w-20 sm:max-w-[100px]">
                        {selectedCity?.city ?? "City"}
                      </span>
                      <ArrowDropdownIcon
                        size={12}
                        color="#27AE60"
                        className={`transition-transform duration-200 shrink-0 ${mobileOpen_city ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    </div>
                  }
                  width="w-[90vw] max-w-[300px] z-999"
                  align="right"
                  renderContent={(close) => (
                    <div className="max-h-80 overflow-y-auto">
                      {/* ================= POPULAR ================= */}
                      <h3 className="text-sm font-semibold text-gray-900 mb-2 px-3 pt-2">
                        Popular Cities
                      </h3>

                      <div className="space-y-1 mb-4 px-3">
                        {popularCities.slice(0, 5).map((i) => (
                          <button
                            key={i._id}
                            onClick={() => {
                              onSelect(i);
                              close?.();
                            }}
                            className="w-full text-left text-sm text-gray-700 px-2 py-2 rounded hover:bg-gray-100 transition"
                          >
                            {i.city}
                          </button>
                        ))}
                      </div>

                      {/* ================= STATES (ACCORDION) ================= */}
                      <div className="px-3">
                        {sortedGroupedByState.map(([stateName, cities]) => {
                          const isOpen = openState === stateName;

                          return (
                            <div key={stateName} className="border-t pt-2 mt-2">
                              {/* STATE HEADER */}
                              <button
                                onClick={() => toggleState(stateName)}
                                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 px-2 py-2"
                              >
                                <span>{stateName}</span>
                                <span className="text-lg leading-none">
                                  {isOpen ? "−" : "+"}
                                </span>
                              </button>

                              {/* CITY LIST */}
                              {isOpen && (
                                <div className="pl-3 mt-1 space-y-1">
                                  {cities.map((c) => (
                                    <button
                                      key={c._id}
                                      onClick={() => {
                                        onSelect(c);
                                        close?.();
                                      }}
                                      className="w-full text-left text-sm text-gray-600 px-2 py-1.5 rounded hover:bg-gray-100 transition"
                                    >
                                      {c.city}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                />
              </div>

              <button
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((s) => !s)}
                className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shrink-0"
              >
                {/* simple hamburger/x */}
                <svg
                  className="w-5 sm:w-6 h-5 sm:h-6"
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
          className={`lg:hidden transition-[max-height] duration-200 ease-in-out overflow-hidden ${mobileOpen ? "max-h-[500px]" : "max-h-0"
            }`}
          aria-hidden={!mobileOpen}
        >
          <div className="px-3 sm:px-4 pb-4 pt-3 sm:pt-4 border-t border-gray-100">
            <nav className="flex flex-col gap-3 sm:gap-4">
              {/* login section */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Account
                </span>
                {user ? (
                  <>
                    <button
                      onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                      className="flex items-center gap-3 p-2 rounded-md bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors w-full text-left"
                    >
                      <div
                        className="h-8 w-8 rounded-full border-2 border-[#27AE60] text-[#27AE60] flex items-center justify-center font-semibold text-xs shrink-0"
                      >
                        {user?.user?.name ? user.user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="text-xs font-medium text-gray-800 truncate">
                          {user?.user?.name || "User"}
                        </span>
                        {user?.user?.roleName && user.user.roleName !== "user" && (
                          <span className="text-xs text-gray-500 capitalize">
                            {user.user.roleName}
                          </span>
                        )}
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${mobileUserMenuOpen ? "rotate-180" : "rotate-0"
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </button>

                    {/* User menu items */}
                    {mobileUserMenuOpen && (
                      <div className="space-y-1 pl-2">
                        {(() => {
                          const userRole = user?.user?.roleName;
                          const options =
                            userRole === "agent"
                              ? [
                                { label: "Dashboard", link: "/agent" },
                                { label: "My Properties", link: "/agent/my-properties" },
                                { label: "Leads", link: "/agent/leads" },
                                { label: "My Plans", link: "/agent/my-plan" },
                                { label: "Account & Settings", link: "/agent/account-settings" },
                              ]
                              : userRole === "builder"
                                ? [
                                  { label: "Dashboard", link: "/builder" },
                                  { label: "My Properties", link: "/builder/my-properties" },
                                  { label: "Leads", link: "/builder/leads" },
                                  { label: "My Plans", link: "/builder/plans" },
                                  { label: "Account & Settings", link: "/builder/account-settings" },
                                ]
                                : [
                                  { label: "My Properties", link: "/my-properties" },
                                  { label: "Shortlisted Properties", link: "/shortlisted-properties" },
                                  { label: "Contacted Properties", link: "/contacted-properties" },
                                  { label: "Manage Subscription", link: "/membership" },
                                  { label: "Account & Settings", link: "/settings" },
                                ];

                          return options.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                router.push(item.link);
                                setMobileOpen(false);
                                setMobileUserMenuOpen(false);
                              }}
                              className="w-full text-left py-2 px-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              {item.label}
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setMobileOpen(false);
                      }}
                      className="py-2 px-2 rounded-md text-sm font-medium text-primary hover:bg-gray-50 transition-colors text-center w-full"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode("register");
                        setMobileOpen(false);
                      }}
                      className="py-2 px-2 rounded-md text-sm font-medium text-primary hover:bg-gray-50 transition-colors text-center w-full"
                    >
                      Register
                    </button>
                  </>
                )}
              </div>

              {/* post property CTA */}
              <div>
                <Link
                  href="/postproperty"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 sm:px-4 py-2 text-sm font-semibold border transition-colors hover:opacity-90"
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
      {authMode === "login" && (
        <LoginDialog
          open={true}
          onClose={() => setAuthMode(null)}
          onSwitchToRegister={() => setAuthMode("register")}
        />
      )}
      {authMode === "register" && (
        <RegisterDialog
          open={true}
          onClose={() => setAuthMode(null)}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      )}
    </header>
  );
};

export default Navbar;
