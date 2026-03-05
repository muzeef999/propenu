"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import { hexToRGBA } from "@/ui/hexToRGBA";
import {
  Building,
  profile,
  Shortlistedicons,
  Subscription,
} from "@/icons/icons";

const menuItems = [
  {
    label: "Account & Settings",
    mobileLabel: "Account",
    link: "/settings",
    icon: profile,
  },
  {
    label: "My Properties",
    mobileLabel: "Properties",
    link: "/my-properties",
    icon: Building,
  },
  {
    label: "Shortlisted Properties",
    mobileLabel: "Saved",
    link: "/shortlisted-properties",
    icon: Shortlistedicons,
  },
  {
    label: "Contacted Properties",
    mobileLabel: "Contacted",
    link: "/contacted-properties",
    icon: MdOutlinePhoneInTalk,
  },
  {
    label: "Membership",
    mobileLabel: "Plans",
    link: "/membership",
    icon: Subscription,
  },
];

const Sidebar = () => {
  const bgColor = hexToRGBA("#27AE60", 0.1);
  const pathname = usePathname();

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
            const isActive = pathname === item.link;
            return (
              <Link
                key={item.link}
                href={item.link}
                className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] transition-all duration-200
                  ${isActive
                    ? "text-[#27A361] bg-white font-semibold shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-[#27A361]"
                  }
                `}
              >
                <Icon
                  size={22}
                  color="currentColor"
                  className={`transition-colors ${isActive
                    ? "text-[#27A361]"
                    : "text-gray-400 group-hover:text-[#27A361]"
                    }`}
                />
                <span className="flex-1">{item.label}</span>

                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#27A361]" />
                )}
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
            <p className="text-gray-500 text-xs mb-5">
              Find Buyers & Tenants easily
            </p>
            <Link href="/post-property" className=" flex btn-primary ">
              Post Property
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile/Tablet bottom tabs: icons only */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white lg:hidden">
        <div className="container mx-auto px-2">
          <div className="grid grid-cols-5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.link;

              return (
                <Link
                  key={item.link}
                  href={item.link}
                  aria-label={item.label}
                  title={item.label}
                  className="flex flex-col items-center justify-center py-2 transition-all duration-300"
                >
                  {/* Icon Wrapper */}
                  <div
                    className={`p-2 rounded-full transition-all duration-300 ${isActive
                        ? "bg-[#27A361]/15 scale-105"
                        : "bg-transparent"
                      }`}
                  >
                    <Icon
                      size={20}
                      className={`transition-all duration-300 ${isActive
                          ? "text-[#27A361]"
                          : "text-gray-400"
                        }`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-xs mt-1 transition-all duration-200 ${isActive
                      ? "text-[#27A361]"
                      : "text-gray-400"
                      }`}
                  >
                    {item.mobileLabel ?? item.label}
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
