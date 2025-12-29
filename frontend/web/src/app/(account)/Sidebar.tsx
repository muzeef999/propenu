"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    MdFavoriteBorder,
    MdOutlinePhoneInTalk,
    MdOutlinePersonOutline,
    MdOutlineHomeWork
} from "react-icons/md";
import { hexToRGBA } from "@/ui/hexToRGBA";
import { Building, profile, Shortlistedicons, Subscription } from "@/icons/icons";

const menuItems = [
    {
        label: "Account & Settings",
        link: "/settings",
        icon: profile,
    },
    {
        label: "My Properties",
        link: "/my-properties",
        icon: Building,
    },
    {
        label: "Shortlisted Properties",
        link: "/shortlisted-properties",
        icon: Shortlistedicons,
    },
    {
        label: "Contacted Properties",
        link: "/contacted-properties",
        icon: MdOutlinePhoneInTalk,
    },
    {
        label: "Membership",
        link: "/membership",
        icon: Subscription,
    },
];

const Sidebar = () => {
      const bgColor = hexToRGBA("#27AE60", 0.1); 
    const pathname = usePathname();

    return (
        <aside className="sticky top-0 h-screen w-72 border-r border-gray-100 card" style={{ backgroundColor: bgColor }}>

            {/* Menu Navigation */}
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
                                className={`transition-colors ${isActive ? "text-[#27A361]" : "text-gray-400 group-hover:text-[#27A361]"}`}
                            />
                            <span className="flex-1">{item.label}</span>

                            {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#27A361]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* CTA Section - Pushed to the Bottom */}
            <div className="mt-auto p-4">
                <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8F5EE] text-center">
                    {/* Title Section */}
                    <h3 className="text-lg font-medium text-gray-800 leading-tight mb-2">
                        Sell/Rent Your Property <br />
                        with us for <span className="text-[#27A361]">Free</span>
                    </h3>

                    {/* Subtitle Section */}
                    <p className="text-gray-500 text-xs mb-5">
                        Find Buyers & Tenants easily
                    </p>

                    {/* Action Button */}
                    <Link
                        href="/post-property"
                        className="flex btn-primary items-center justify-center w-full rounded-xl text-white text-sm font-semibold py-3 transition-all active:scale-[0.98] shadow-md shadow-green-100"
                    >
                        Post Property
                    </Link>
                </div>
            </div>

        </aside>
    );
};

export default Sidebar;