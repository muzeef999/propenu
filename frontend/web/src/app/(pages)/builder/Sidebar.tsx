"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hexToRGBA } from "@/ui/hexToRGBA";
import { Building, profile, Subscription } from "@/icons/icons";
import { FaCrown, FaHeart } from "react-icons/fa";
import { TbBuildingSkyscraper } from "react-icons/tb";
import { RiDeleteBin6Line, RiUserHeartLine } from "react-icons/ri";
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
    label:"My Shortlists",
    mobileLabel: "Shortlists",
    link: "/builder/my-shortlists",
    icon: FaHeart,
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
    label: "Prime Projects",
    mobileLabel: "Prime",
    link: "/builder/prime-projects",
    icon: FaCrown,
  },
  {
    label: "Support",
    mobileLabel: "Support",
    link: "/builder/support",
    icon: BiSupport,
  },
  {
    label: "Account Settings",
    mobileLabel: "Settings",
    link: "/builder/account-settings",
    icon: FiSettings,
  },
  {
    label: "Delete Account",
    mobileLabel: "Delete",
    link: "/builder/delete-account",
    icon: RiDeleteBin6Line,
  },
];

const Sidebar = () => {
  const bgColor = hexToRGBA("#27AE60", 0.1);
  const pathname = usePathname();
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    setRoleName(String(localStorage.getItem("role") ?? "").toLowerCase());
  }, []);

  const visibleMenuItems =
    roleName === "builder_staff"
      ? menuItems.filter(
          (item) =>
            item.link !== "/builder/roles" &&
            item.link !== "/builder/delete-account",
        )
      : menuItems;

  const isItemActive = (link: string) => {
    if (link === "/builder") return pathname === "/builder";
    return pathname === link || pathname.startsWith(`${link}/`);
  };

  return (
    <>
      <aside
        className="hidden lg:flex lg:flex-col sticky top-0 h-screen w-72 border-r border-gray-100 card"
        style={{ backgroundColor: bgColor }}
      >
        {/* Desktop Menu Navigation */}
        <nav className="px-4 space-y-1.5 mt-10">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.link);

            return (
              <Link
                key={item.link}
                href={item.link}
                className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] transition-all duration-200
                  ${
                    isActive
                      ? "text-[#27A361] bg-white font-semibold shadow-sm"
                      : "text-gray-500 hover:bg-white/50 hover:text-[#27A361]"
                  }
                `}
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

                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#27A361]" />}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA
        <div className="mt-auto p-4">
          <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8F5EE] text-center">
            <h3 className="text-lg font-medium text-gray-800 leading-tight mb-2">
              Sell/Rent Your Property <br />
              with us for <span className="text-[#27A361]">Free</span>
            </h3>
            <p className="text-gray-500 text-xs mb-5">Find Buyers & Tenants easily</p>
            <Link href="/post-property" className="flex btn-primary">
              Post Property
            </Link>
          </div>
        </div> */}
      </aside>

      {/* Mobile/Tablet Bottom Tabs */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white lg:hidden">
        <div className="container mx-auto px-2">
          <div className="flex overflow-x-auto">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.link);

              return (
                <Link
                  key={item.link}
                  href={item.link}
                  aria-label={item.label}
                  title={item.label}
                  className="flex min-w-[76px] flex-col items-center justify-center py-2 transition-all duration-300"
                >
                  <div
                    className={`p-2 rounded-full transition-all duration-300 ${
                      isActive ? "bg-[#27A361]/15 scale-105" : "bg-transparent"
                    }`}
                  >
                    <span
                      className={`transition-all duration-300 ${
                        isActive ? "text-[#27A361]" : "text-gray-400"
                      }`}
                    >
                      <Icon size={20} color="currentColor" />
                    </span>
                  </div>

                  <span
                    className={`text-[11px] mt-1 transition-all duration-200 ${
                      isActive ? "text-[#27A361]" : "text-gray-400"
                    }`}
                  >
                    {item.mobileLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
