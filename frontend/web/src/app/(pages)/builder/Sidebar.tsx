"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hexToRGBA } from "@/ui/hexToRGBA";
import { Building, profile } from "@/icons/icons";
import { TbBuildingSkyscraper } from "react-icons/tb";
import { RiUserHeartLine } from "react-icons/ri";
import { FiSettings, FiUsers } from "react-icons/fi";
import { BiSupport } from "react-icons/bi";

const menuItems = [
  {
    label: "Dashboard",
    mobileLabel: "Dashboard",
    link: "/builder",
    icon: profile,
  },
  {
    label: "Leads",
    mobileLabel: "Leads",
    link: "/builder/leads",
    icon: Building,
  },
  {
    label: "Roles & Team",
    mobileLabel: "Team",
    link: "/builder/roles",
    icon: FiUsers,
  },
  {
    label: "Relationship Manager",
    mobileLabel: "RM",
    link: "/builder/relationship-manager",
    icon: FiUsers,
  },
  {
    label: "User Shortlists",
    mobileLabel: "Shortlists",
    link: "/builder/user-shortlists",
    icon: RiUserHeartLine,
  },
  {
    label: "My Projects",
    mobileLabel: "Listings",
    link: "/builder/my-projects",
    icon: TbBuildingSkyscraper,
  },
  {
    label: "Account Settings",
    mobileLabel: "Settings",
    link: "/builder/account-settings",
    icon: FiSettings,
  },
  {
    label: "Support",
    mobileLabel: "Support",
    link: "/builder/support",
    icon: BiSupport,
  },
] as const;

const Sidebar = () => {
  const bgColor = hexToRGBA("#27AE60", 0.1);
  const pathname = usePathname();
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    setRoleName(String(localStorage.getItem("role") ?? "").toLowerCase());
  }, []);

  const visibleMenuItems =
    roleName === "builder_staff"
      ? menuItems.filter((item) => item.link !== "/builder/roles")
      : menuItems;

  const isItemActive = (link: string) => {
    if (link === "/builder") return pathname === "/builder";
    return pathname === link || pathname.startsWith(`${link}/`);
  };

  return (
    <>
      <aside
        className="sticky top-0 hidden h-screen w-72 border-r border-gray-100 card lg:flex lg:flex-col"
        style={{ backgroundColor: bgColor }}
      >
        <nav className="mt-10 space-y-1.5 px-4">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.link);

            return (
              <Link
                key={item.link}
                href={item.link}
                className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] transition-all duration-200 ${
                  isActive
                    ? "bg-white font-semibold text-[#27A361] shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-[#27A361]"
                }`}
              >
                <span
                  className={`transition-colors ${
                    isActive
                      ? "text-[#27A361]"
                      : "text-gray-400 group-hover:text-[#27A361]"
                  }`}
                >
                  <Icon size={22} color="currentColor" />
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-[#27A361]" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
