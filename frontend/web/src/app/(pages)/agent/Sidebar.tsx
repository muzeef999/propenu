"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FaChartLine, FaHeart, FaUserPlus } from "react-icons/fa";
import { hexToRGBA } from "@/ui/hexToRGBA";
import { Building, Subscription } from "@/icons/icons";
import { RiAccountCircle2Fill, RiDeleteBin6Line } from "react-icons/ri";
import { BiSupport } from "react-icons/bi";
import { FiBell } from "react-icons/fi";
import { getAgentNotificationSummary } from "@/data/ClientData";

const menuItems = [
  {
    label: "Dashboard",
    mobileLabel: "Home",
    link: "/agent",
    icon: FaChartLine,
  },
  {
    label: "Leads",
    mobileLabel: "Leads",
    link: "/agent/leads",
    icon: FaUserPlus,
  },
  {
    label: "My Properties",
    mobileLabel: "Props",
    link: "/agent/my-properties",
    icon: Building,
  },
  {
    label: "Shortlist Properties",
    mobileLabel: "Shortlist",
    link: "/agent/shortlisted-properties",
    icon: FaHeart,
  },
  {
    label: "Notifications",
    mobileLabel: "Alerts",
    link: "/agent/notifications",
    icon: FiBell,
  },
  {
    label: "My Plan",
    mobileLabel: "Plan",
    link: "/agent/my-plan",
    icon: Subscription,
  },
  {
    label: "Account & Settings",
    mobileLabel: "Account",
    link: "/agent/account-settings",
    icon: RiAccountCircle2Fill,
  },
  {
    label: "Support",
    mobileLabel: "Support",
    link: "/agent/support",
    icon: BiSupport,
  },
  // {
  //   label: "Delete Account",
  //   mobileLabel: "Delete",
  //   link: "/agent/delete-account",
  //   icon: RiDeleteBin6Line,
  // },
];

const Sidebar = () => {
  const bgColor = hexToRGBA("#27AE60", 0.1);
  const pathname = usePathname();
  const { data: notificationData } = useQuery({
    queryKey: ["agent-notifications-summary"],
    queryFn: getAgentNotificationSummary,
    staleTime: 30000,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
  const notificationCount = notificationData?.summary?.unread ?? 0;

  const isItemActive = (link: string) => {
    if (link === "/agent") return pathname === "/agent";
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
          {menuItems.map((item) => {
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
                {item.link === "/agent/notifications" && notificationCount > 0 && (
                  <span className="min-w-[22px] rounded-full bg-[#27A361] px-2 py-0.5 text-center text-xs font-semibold leading-5 text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}

                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#27A361]" />}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="mt-auto p-4">
          <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8F5EE] text-center">
            <h3 className="text-lg font-medium text-gray-800 leading-tight mb-2">
              Sell/Rent Your Property <br />
              with us for <span className="text-[#27A361]">Free</span>
            </h3>
            <p className="text-gray-500 text-xs mb-5">Find Buyers & Tenants easily</p>
            <Link href="/postproperty" className="flex btn-primary">
              Post Property
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile/Tablet Bottom Tabs */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white lg:hidden">
        <div className="container mx-auto px-2">
          <div className="grid grid-cols-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.link);

              return (
                <Link
                  key={item.link}
                  href={item.link}
                  aria-label={item.label}
                  title={item.label}
                  className="flex flex-col items-center justify-center py-2 transition-all duration-300"
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
