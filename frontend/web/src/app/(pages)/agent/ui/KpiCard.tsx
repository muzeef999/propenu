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
      className="flex items-center justify-between rounded-xl p-5 border border-gray-100 shadow-sm"
      style={{ backgroundColor: bgColor }}
    >
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-semibold text-gray-900 mt-1">
          {value}
        </h3>
      </div>

      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </div>
    </div>
  );
};

export default KpiCard;
