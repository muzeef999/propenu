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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-400 text-sm text-center">
        No top performing properties available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Top Performing Properties
          </h2>
          <p className="text-sm text-gray-500">
            Your best performing listings
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "views" | "inquiries")
            }
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
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
              className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:shadow-sm transition"
            >
              {/* Left */}
              <div className="flex items-center gap-4">
                <Image
                  src={item.image || "/placeholder.jpg"}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />

                <div>
                  <h3 className="font-medium text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.city}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Views</p>
                  <p className="font-semibold text-gray-900">
                    {item.views.toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">Inquiries</p>
                  <p className="font-semibold text-gray-900">
                    {item.inquiries}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${perf.bg} ${perf.text}`}
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
