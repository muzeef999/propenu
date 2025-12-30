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
    icon: <ServiceHomeLoan/>,
    title: "Easy Home Loans with Expert Support",
    desc: "Quick approvals, low interest, zero hassle.",
  },
  {
    href: "/home-care",
    icon: <ServiceHomeCare  />,
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
  const { selectedCity  } = useCity();
  return (
    <>
      <div className="flex justify-between items-center m-0">
        <div className="headingSideBar">
          <h1 className="text-2xl font-bold">Explore Our Services</h1>
          <p className="headingDesc">
            Building excellence in {selectedCity?.city ?? "Hyderabad"}
          </p>
        </div>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.map((c) => (
          <Link key={c.href} href={c.href}>
              <div className="flex items-start card p-4">
                {/* Icon badge */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 ring-1 ring-indigo-100"
                    aria-hidden
                  >
                    {c.icon}
                  </div>
                {/* Content */}
                <div className="flex-1 p-2 pl-6">
                  <h3 className={"text-2xl headingblack font-medium"}>{c.title}</h3>
                  <p className="mt-2 text-base headingDesc">{c.desc}</p>
                  <div className=" mt-auto pt-4">
                    <span className="flex gap-2 text-primary justify-left items-center">
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
