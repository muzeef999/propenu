"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";

export type TopProperty = {
  _id: string;
  title: string;
  city: string;
  image?: string;
  views: number;
  inquiries: number;
};

type Props = {
  properties: TopProperty[];
};

const getPerformance = (views: number) => {
  if (views > 1000)
    return { label: "High", bg: "bg-green-100", text: "text-green-700" };
  if (views > 700)
    return { label: "Medium", bg: "bg-yellow-100", text: "text-yellow-700" };
  return { label: "Low", bg: "bg-red-100", text: "text-red-700" };
};

const TopPropertiesTable: React.FC<Props> = ({ properties }) => {
  const [sortBy, setSortBy] = useState<"views" | "inquiries">("views");

  const sorted = useMemo(() => {
    return [...properties].sort((a, b) =>
      sortBy === "views"
        ? b.views - a.views
        : b.inquiries - a.inquiries
    );
  }, [properties, sortBy]);

  if (!properties.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 text-gray-400 text-sm text-center">
        No top performing properties available
      </div>
    );
  }
  console.log("data", properties);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">
            Top Performing Properties
          </h2>
          <p className="text-sm text-gray-500">
            Your best performing listings
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm w-full sm:w-auto">
          <span className="text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "views" | "inquiries")
            }
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none w-full sm:w-auto"
          >
            <option value="views">Views</option>
            <option value="inquiries">Inquiries</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {sorted.map((item) => {
          const perf = getPerformance(item.views);

          return (
            <div
              key={item._id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-gray-100 p-4 hover:shadow-sm transition"
            >
              {/* Left */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <Image
                  src={item.image || "/placeholder.jpg"}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover w-14 h-14 sm:w-16 sm:h-16"
                />

                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {item.city}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 md:flex md:items-center md:gap-8 w-full md:w-auto">
                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-500">Views</p>
                  <p className="font-semibold text-gray-900">
                    {item.views.toLocaleString()}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-xs text-gray-500">Inquiries</p>
                  <p className="font-semibold text-gray-900">
                    {item.inquiries}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${perf.bg} ${perf.text} self-start md:self-auto`}
                >
                  {perf.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopPropertiesTable;
