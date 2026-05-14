"use client";

import Link from "next/link";
import { useCity } from "@/hooks/useCity";
import {
  ArrowDropdownIcon,
  ServiceHomeCare,
  ServiceHomeLoan,
  ServiceInteriorDesigner,
} from "@/icons/icons";

/**
 * ExploreOurServices
 * - Responsive grid: sm:2, md:3, lg:4
 * - Card is a link with semantic <a> for accessibility
 */

const data = [
  {
    href: "/home-loans",
    icon: <ServiceHomeLoan />,
    title: "Easy Home Loans & Expert Support",
    desc: "Quick approvals, low interest, zero hassle.",
  },
  {
    href: "/home-care",
    icon: <ServiceHomeCare />,
    title: "Professional Home Care",
    desc: "Reliable cleaning, repairs, and maintenance.",
  },
  {
    href: "/interior-designer",
    icon: <ServiceInteriorDesigner />,
    title: "Modern Interior Designers",
    desc: "Transforming your space with expert creativity.",
  },
];

export default function ExploreOurServices() {
  const { selectedCity } = useCity();
  return (
    <>
      <div className="flex flex-col gap-3 m-0 p-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="headingSideBar">
          <h1 className="text-base font-bold sm:text-2xl truncate">
            Explore Our Services
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-base truncate">
            Services tailored for {selectedCity?.city ?? "Hyderabad"} residents
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.map((c) => (
          <Link key={c.href} href={c.href}>
            <div className="card p-4 flex flex-col sm:flex-row items-start gap-3 sm:gap-0">
              {/* Icon badge */}
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-indigo-50 ring-1 ring-indigo-100 shrink-0"
                aria-hidden>
                {c.icon}
              </div>

              {/* Content */}
              <div className="flex-1 sm:pl-6">
                <h3 className="text-lg sm:text-2xl headingblack font-medium">
                  {c.title}
                </h3>

                <p className="mt-1 sm:mt-2 text-sm sm:text-base headingDesc">
                  {c.desc}
                </p>

                <div className="pt-3 sm:pt-4">
                  <span className="flex items-center gap-2 text-primary text-sm sm:text-base">
                    Know more
                    <ArrowDropdownIcon
                      size={12}
                      className="rotate-270"
                      color="#27AE60"
                    />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
