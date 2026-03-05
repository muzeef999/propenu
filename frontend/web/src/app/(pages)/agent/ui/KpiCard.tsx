"use client";

import React from "react";

type KpiCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor?: string;
  iconBgColor?: string;
};

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  bgColor = "#F9FAFB",
  iconBgColor = "#E5E7EB",
}) => {
  return (
    <div
      className="flex items-center justify-between rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm gap-3"
      style={{ backgroundColor: bgColor }}
    >
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1 wrap-break-word">
          {value}
        </h3>
      </div>

      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </div>
    </div>
  );
};

export default KpiCard;
