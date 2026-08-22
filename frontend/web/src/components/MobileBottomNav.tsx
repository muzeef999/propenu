"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IoAddCircleOutline,
  IoCompassOutline,
  IoEllipsisHorizontal,
  IoHeartOutline,
  IoHome,
  IoHomeOutline,
} from "react-icons/io5";

const OPEN_MOBILE_MENU_EVENT = "propenu:open-mobile-menu";
const OPEN_AUTH_LOGIN_EVENT = "propenu:open-auth-login";

type NavItem = {
  key: string;
  label: string;
  href?: string;
  isActive: (pathname: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
  onClick?: () => void;
};

export default function MobileBottomNav({
  isAuthenticated,
  hidden = false,
}: {
  isAuthenticated: boolean;
  hidden?: boolean;
}) {
  const pathname = usePathname() || "/";

  const navItems: NavItem[] = [
    {
      key: "home",
      label: "Home",
      href: "/",
      isActive: (currentPath) => currentPath === "/",
      icon: (active) =>
        active ? (
          <IoHome className="h-5 w-5" />
        ) : (
          <IoHomeOutline className="h-5 w-5" />
        ),
    },
    {
      key: "explore",
      label: "Explore",
      href: "/properties?type=residential",
      isActive: (currentPath) => currentPath.startsWith("/properties"),
      icon: () => <IoCompassOutline className="h-5 w-5" />,
    },
    {
      key: "sell-rent",
      label: "Sell/Rent",
      href: "/postproperty",
      isActive: (currentPath) => currentPath.startsWith("/postproperty"),
      icon: () => <IoAddCircleOutline className="h-6 w-6" />,
    },
    {
      key: "shortlist",
      label: "Shortlist",
      href: isAuthenticated ? "/shortlisted-properties" : undefined,
      isActive: (currentPath) =>
        currentPath.startsWith("/shortlisted-properties"),
      icon: () => <IoHeartOutline className="h-5 w-5" />,
      onClick: !isAuthenticated
        ? () => {
            window.dispatchEvent(new Event(OPEN_AUTH_LOGIN_EVENT));
          }
        : undefined,
    },
    {
      key: "more",
      label: "More",
      isActive: () => false,
      icon: () => <IoEllipsisHorizontal className="h-5 w-5" />,
      onClick: () => {
        window.dispatchEvent(new Event(OPEN_MOBILE_MENU_EVENT));
      },
    },
  ];

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-[#dbe5de] bg-white/96 shadow-[0_-8px_24px_rgba(17,24,39,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/88 lg:hidden transition-opacity duration-200 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-label="Mobile bottom navigation"
    >
      <div className="mx-auto flex max-w-screen-sm items-end justify-between px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const content = (
            <>
              <span
                className={`flex items-center justify-center transition-colors ${
                  active ? "text-[#27AE60]" : "text-[#8c8c8c]"
                }`}
              >
                {item.icon(active)}
              </span>
              <span
                className={`mt-1 text-[11px] font-medium leading-none ${
                  active ? "text-[#27AE60]" : "text-[#8c8c8c]"
                }`}
              >
                {item.label}
              </span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={item.onClick}
                className="flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-1"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className="flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-1"
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
