"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/animations/Logo";
import { ArrowDropdownIcon, LocationIcon } from "@/icons/icons";
import type { DropdownProps } from "@/ui/SingleDropDown";
import dynamic from "next/dynamic";
import Link from "next/link";
import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";
import Cookies from "js-cookie";
import { getUserNotificationSummary, me } from "@/data/ClientData";
import UserGreeting, { getOptionsForRole } from "@/app/(auth)/UserGreeting";
import FilterDropdown from "@/ui/FilterDropdown";
import { useCity } from "@/hooks/useCity";
import { LocationItem } from "@/types";
import { useAppDispatch } from "@/Redux/store";
import {
  setAgriculturalFilter,
  setCommercialFilter,
  setLandFilter,
  setListingType,
  setResidentialFilter,
  setSearchText,
} from "@/Redux/slice/filterSlice";
import { useQuery } from "@tanstack/react-query";
import SearchBox from "@/components/SearchBox";
import { IoArrowBack, IoNotificationsOutline, IoSearchOutline } from "react-icons/io5";

type AuthMode = "login" | "register" | null;
const OPEN_MOBILE_MENU_EVENT = "propenu:open-mobile-menu";
const OPEN_AUTH_LOGIN_EVENT = "propenu:open-auth-login";

const Dropdown = dynamic<DropdownProps>(() => import("@/ui/SingleDropDown"), {
  ssr: false,
});

const BRAND_GREEN = "#27AE60";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false); // Separate state for auth dialog
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false); // Separate state for city dropdown
  const [mobileOpen_city, setMobileOpen_city] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<any>(null);
  const [registerStep, setRegisterStep] = useState<"personal" | "location">(
    "personal",
  );
  const isBuilder = user?.user?.roleName === "builder";
  const isAuthenticated = Boolean(user?.user);
  const mobileUserOptions = user ? getOptionsForRole(user?.user?.roleName) : [];
  const { selectedCity, locations, selectCity } = useCity();
  const hideMobileNavSearchRow = pathname.startsWith("/properties");
  const notificationRoute = isBuilder
    ? "/builder/notifications"
    : user?.user?.roleName === "agent"
      ? "/agent/notifications"
      : "/notifications";
  const mobileSearchPlaceholder = selectedCity?.city
    ? `Search in ${selectedCity.city}`
    : "Search in Mangalore";

  const { data: notificationSummary } = useQuery({
    queryKey: ["navbar-notifications-summary", user?.user?.roleName],
    queryFn: getUserNotificationSummary,
    enabled: isAuthenticated && !isBuilder && user?.user?.roleName !== "agent",
    staleTime: 60_000,
  });
  const notificationCount = notificationSummary?.summary?.unread ?? 0;

  useEffect(() => {
    if (mobileOpen || mobileSearchOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileOpen, mobileSearchOpen]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await me();
        setUser(data);

        const status = data?.user?.accountStatus;

        localStorage.setItem("role", data.user.roleName);

        if (status === "location_pending") {
          setRegisterStep("location");
        }

      } catch (err) {
        // user not logged in
      }
    }

    fetchUser();

    const handleAuthChanged = () => {
      fetchUser();
    };

    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, []);

  function onSelect(item: LocationItem) {
    selectCity(item);
    dispatch(setResidentialFilter({ key: "locality", value: [] }));
    dispatch(setCommercialFilter({ key: "locality", value: [] }));
    dispatch(setLandFilter({ key: "locality", value: "" }));
    dispatch(setAgriculturalFilter({ key: "locality", value: "" }));
    dispatch(setSearchText(""));
    setCityDropdownOpen(false);
    setMobileOpen_city(false);
    btnRef.current?.focus();
  }

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.removeItem("role");
    setUser(null);
    setAuthMode(null);
    setIsAuthDialogOpen(false);
    setMobileOpen(false);
    window.location.href = "/";
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setCityDropdownOpen(false);

      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setMobileOpen_city(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCityDropdownOpen(false);
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

  useEffect(() => {
    const openMobileMenu = () => setMobileOpen(true);
    const openAuthLogin = () => openLoginDialog();

    window.addEventListener(OPEN_MOBILE_MENU_EVENT, openMobileMenu);
    window.addEventListener(OPEN_AUTH_LOGIN_EVENT, openAuthLogin);

    return () => {
      window.removeEventListener(OPEN_MOBILE_MENU_EVENT, openMobileMenu);
      window.removeEventListener(OPEN_AUTH_LOGIN_EVENT, openAuthLogin);
    };
  }, []);

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  // Function to open login dialog
  const openLoginDialog = () => {
    setIsAuthDialogOpen(true);
    setAuthMode("login");
  };

  // Function to close auth dialog
  const closeAuthDialog = () => {
    setIsAuthDialogOpen(false);
    setAuthMode(null);
  };

  const getInitial = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const visibleLocations = locations.filter((loc) => loc.isHome === true);

  const popularCities = visibleLocations.filter(
    (loc) => loc.category?.toLowerCase() === "popular",
  );

  const popularCityIds = new Set(popularCities.map((city) => city._id));
  const otherCities = visibleLocations
    .filter((city) => !popularCityIds.has(city._id))
    .sort((a, b) => {
      if (a.city === selectedCity?.city) return -1;
      if (b.city === selectedCity?.city) return 1;
      return a.city.localeCompare(b.city);
    });

  const handleMobileSearchClick = () => {
    setMobileSearchOpen(true);
  };

  return (
    <header>
      <nav
        className="relative z-50 w-full border-b border-gray-200 bg-white"
        aria-label="Main navigation"
      >
        <div className="border-b border-[#cfead8] bg-[linear-gradient(135deg,#f4fff7_0%,#e1f7e8_30%,#caecd7_68%,#eefaf2_100%)] lg:hidden">
          <div className="container mx-auto px-2 py-2.5">
            <div className="flex items-center gap-2">
              {/* <button
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((s) => !s)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#d6ebdb] bg-white text-[#1b6b3f]"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
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
              </button> */}

              <Link
                href="/"
                className="flex min-w-0 flex-1 select-none items-center gap-0.5" aria-label="Go to homepage"
              >
                <div className="w-5 h-5 shrink-0 sm:w-7 sm:h-7">
                  <Logo />
                </div>

                <span className="truncate text-base font-semibold tracking-tight text-primary sm:text-lg lg:text-xl">
                  PROPENU
                  <sup className="ml-0.5 align-super text-[8px] sm:text-[10px] font-normal text-[#646464]">
                    TM
                  </sup>
                </span>
              </Link>

              {!isBuilder && (
                <Link
                  href="/postproperty"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#d6ebdb] bg-white px-3 text-[12px] font-semibold text-[#4a7a5d]"
                >
                  <span>Post Property</span>
                  <span className="rounded-md bg-[#27AE60] px-1.5 py-[3px] text-[10px] font-bold uppercase leading-none text-white">
                    Free
                  </span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    openLoginDialog();
                    return;
                  }

                  router.push(notificationRoute);
                }}
                aria-label={isAuthenticated ? "Open notifications" : "Login to view notifications"}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#d6ebdb] bg-white text-[#1b1b1b]"
              >
                <IoNotificationsOutline className="h-[18px] w-[18px]" />
                {notificationCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[#27AE60] px-1 text-[9px] font-semibold leading-4 text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            </div>

            {!hideMobileNavSearchRow && (
              <div className="mt-2 grid grid-cols-[128px_minmax(0,1fr)] gap-2">
                <div ref={mobileDropdownRef} className="relative">
                  <div className="w-full rounded-[8px] border border-[#d6ebdb] bg-white px-3 py-[11px]">
                    <FilterDropdown
                      open={mobileOpen_city}
                      onOpenChange={(next) => setMobileOpen_city(next)}
                      backdropClassName="fixed inset-0 bg-black/45 z-40 transition-all duration-100"
                      triggerLabel={
                        <div className="flex min-w-0 items-center gap-1.5">
                          <LocationIcon size={14} color="#1b1b1b" />
                          <span className="truncate text-left text-[13px] font-medium text-[#2c2c2c]">
                            {selectedCity?.city ?? "Select city"}
                          </span>
                          <ArrowDropdownIcon
                            size={10}
                            color="#1b1b1b"
                            className={`shrink-0 transition-transform duration-200 ${mobileOpen_city ? "rotate-180" : "rotate-0"
                              }`}
                          />
                        </div>
                      }
                      width="w-[90vw] max-w-[300px] z-999"
                      align="left"
                      renderContent={(close) => (
                        <div className="max-h-80 overflow-y-auto">
                          <h3 className="mb-2 px-3 pt-2 text-sm font-semibold text-gray-900">
                            Popular Cities
                          </h3>

                          <div className="mb-4 space-y-1 px-3">
                            {popularCities.slice(0, 5).map((i) => (
                              <button
                                key={i._id}
                                onClick={() => {
                                  onSelect(i);
                                  close?.();
                                }}
                                className="w-full rounded px-2 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100"
                              >
                                {i.city}
                              </button>
                            ))}
                          </div>

                          <div className="px-3">
                            <div className="mt-2 border-t pt-2">
                              <h3 className="w-full px-2 py-2 text-sm font-semibold text-gray-900">
                                Other Cities
                              </h3>
                              <div className="mt-1 space-y-1 pl-3">
                                {otherCities.map((c) => (
                                  <button
                                    key={c._id}
                                    onClick={() => {
                                      onSelect(c);
                                      close?.();
                                    }}
                                    className="w-full rounded px-2 py-1.5 text-left text-sm text-gray-600 transition hover:bg-gray-100"
                                  >
                                    {c.city}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleMobileSearchClick}
                  className="flex h-[46px] items-center gap-2 rounded-[8px] border border-[#d6ebdb] bg-white px-3 text-left"
                  aria-label="Search properties"
                >
                  <IoSearchOutline className="h-[18px] w-[18px] shrink-0 text-[#8a8a8a]" />
                  <span className="truncate text-[14px] text-[#8a8a8a]">
                    {mobileSearchPlaceholder}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto hidden px-1 sm:px-4 lg:block lg:px-3">
          <div className="flex h-14 items-center justify-between sm:h-16">
            {/* LEFT */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {/* Hamburger for mobile */}
              <button
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((s) => !s)}
                className="lg:hidden inline-flex items-center justify-center sm:p-2 rounded-md hover:bg-gray-100 shrink-0"
              >
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

              <Link
                href="/"
                className="flex items-center sm:gap-1 select-none shrink-0"
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
                    open={cityDropdownOpen}
                    onOpenChange={(next) => setCityDropdownOpen(next)}
                    backdropClassName="fixed inset-0 bg-black/45 z-40 transition-all duration-100"
                    triggerLabel={
                      <div className="flex gap-1 items-center justify-center">
                        <LocationIcon size={18} color="#27AE60" />
                        <span className="min-w-[90px] text-primary text-left truncate">
                          {selectedCity?.city ?? "Select City"}
                        </span>
                        <ArrowDropdownIcon
                          size={12}
                          color="#27AE60"
                          className={`transition-transform duration-200 shrink-0 ${cityDropdownOpen ? "rotate-180" : "rotate-0"
                            }`}
                        />
                      </div>
                    }
                    width="w-[90vw] max-w-[680px] z-999"
                    align="left"
                    renderContent={(close) => (
                      <div className="max-h-[80vh] overflow-y-auto px-2.5 py-1.5">
                        <div>
                          <h3 className="text-[15px] font-semibold text-gray-900">
                            Popular Cities
                          </h3>
                          <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3 lg:grid-cols-5">
                            {popularCities.map((i) => {
                              const isSelected = selectedCity?._id === i._id;

                              return (
                                <button
                                  key={i._id}
                                  onClick={() => {
                                    onSelect(i);
                                    close?.();
                                  }}
                                  className={`py-px text-left text-[14px] leading-[1.15rem] transition-colors ${isSelected
                                    ? "font-semibold text-[#27AE60]"
                                    : "text-gray-700 hover:text-[#27AE60]"
                                    }`}
                                >
                                  <span className="block truncate">{i.city}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-4">
                          <h3 className="text-[15px] font-semibold text-gray-900">
                            Other Cities
                          </h3>
                          <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3 lg:grid-cols-5">
                            {otherCities.map((c) => {
                              const isSelected = selectedCity?._id === c._id;

                              return (
                                <button
                                  key={c._id}
                                  onClick={() => {
                                    onSelect(c);
                                    close?.();
                                  }}
                                  className={`py-px text-left text-[14px] leading-[1.15rem] transition-colors ${isSelected
                                    ? "font-semibold text-[#27AE60]"
                                    : "text-gray-700 hover:text-[#27AE60]"
                                    }`}
                                >
                                  <span className="block truncate">{c.city}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT - desktop */}
            <div className="hidden lg:flex items-center gap-4 lg:gap-6 text-[#1A1A1A] shrink-0">
              <>
                {!isAuthenticated ? (
                  <button
                    onClick={openLoginDialog}
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    Login
                  </button>
                ) : (
                  <UserGreeting user={user} />
                )}
              </>

              {/* CTA - secondary outlined */}
              {!isBuilder && (
                <Link
                  href="/postproperty"
                  className="btn btn-secondary text-xs sm:text-sm whitespace-nowrap"
                >
                  Post Property
                  <span className="text-xs bg-[#27AE60] px-1 text-white rounded">
                    Free
                  </span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </nav>

      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[70] bg-[#f4fbf6] lg:hidden">
          <div className="flex items-center gap-3 border-b border-[#dfe9e2] bg-white px-3 py-3">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1f2d24]"
            >
              <IoArrowBack className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1f2d24]">
                Search properties
              </p>
              <p className="text-xs text-[#6a7b71]">
                Find cities, localities and projects
              </p>
            </div>
          </div>

          <div className="px-3 py-3">
            <SearchBox
              autoFocus
              hideOnMobile={false}
              mobileMode
              onNavigate={() => setMobileSearchOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Menu (Sidebar) & Overlay */}
      <>
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <div
          className={`fixed top-0 left-0 h-[120vh] w-75 max-w-[90vw] bg-white shadow-lg lg:hidden transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          aria-hidden={!mobileOpen}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="absolute top-4 right-3 z-10 h-9 w-9 rounded-full bg-black/70 text-white backdrop-blur flex items-center justify-center shadow-lg hover:bg-black/90 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="border-b border-gray-200 bg-gray-50">
            {!user ? (
              <div className="flex items-center justify-between gap-3 px-4 py-4 pr-14 bg-gray-50">
                <span className="text-xs text-gray-700 leading-snug">
                  Sign in for a <br />
                  <span className="font-semibold">
                    smarter property experience
                  </span>
                </span>

                <button
                  onClick={() => {
                    openLoginDialog();
                    setMobileOpen(false);
                  }}
                  style={{ backgroundColor: BRAND_GREEN }}
                  className="text-white text-xs font-semibold px-4 py-1.5 rounded-md shadow-sm whitespace-nowrap transition-all hover:opacity-90 active:scale-95"
                >
                  Login
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-4 pr-14 bg-gray-50">
                <div className="h-9 w-9 rounded-full border border-[#27AE60] text-[#26ad5f] flex items-center justify-center font-semibold text-sm shadow shrink-0">
                  {getInitial(user?.user?.name)}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    Hi, {user?.user?.name?.split(" ")?.[0] ?? "User"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            <nav className="px-2">
              {[
                {
                  label: "Buy",
                  link: "/properties?type=residential",
                  listingType: {
                    label: "Buy" as const,
                    value: "sale" as const,
                  },
                },
                {
                  label: "Rent",
                  link: "/properties?type=residential",
                  listingType: {
                    label: "Rent" as const,
                    value: "rent" as const,
                  },
                },
                // { label: "Home Loans", link: "/home-loans" },
                // { label: "Home Interiors", link: "/interior-designer" },
                // { label: "Home Care", link: "/home-care" },
                // { label: "Help & Support", link: "/help-center" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.listingType) {
                      dispatch(setListingType(item.listingType));
                    }
                    router.push(item.link);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-1 py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                      {item.label}
                    </span>
                  </div>

                  <svg
                    className="w-4 h-4 text-gray-300 group-hover:text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </nav>

            {user && (
              <div className="px-2">
                {/* <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Account
                </p> */}
                {mobileUserOptions.map((item) => {
                  const isLogout = item.label === "Logout";

                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (isLogout) {
                          handleLogout();
                          return;
                        }

                        router.push(item.link);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-1 py-3 border-b border-gray-200 transition-colors group ${isLogout
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <span className="text-sm font-medium group-hover:text-primary">
                        {item.label}
                      </span>

                      <svg
                        className={`w-4 h-4 ${isLogout
                          ? "text-red-300"
                          : "text-gray-300 group-hover:text-primary"
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!isBuilder && (
            <div className="p-2">
              <Link
                href="/postproperty"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-[#27AE60] text-white py-3 rounded-md font-semibold text-sm shadow-md shadow-green-100 active:scale-[0.98] transition-all"
              >
                Post Property
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
                  FREE
                </span>
              </Link>
            </div>
          )}
        </div>
      </>

      {/* Auth Dialogs - Now using separate state */}
      {isAuthDialogOpen && authMode === "login" && (
        <LoginDialog
          open={isAuthDialogOpen}
          onClose={closeAuthDialog}
          onSwitchToRegister={() => {
            setAuthMode("register");
          }}
        />
      )}

      {isAuthDialogOpen && authMode === "register" && (
        <RegisterDialog
          open={isAuthDialogOpen}
          initialStep={registerStep}
          onClose={closeAuthDialog}
          onSwitchToLogin={() => {
            setAuthMode("login");
          }}
        />
      )}
    </header>
  );
};

export default Navbar;

