"use client";

import React, { useState } from "react";
import {
  HiHome,
  HiCheckCircle,
  HiClock,
  HiEye,
  HiCursorClick,
  HiChatAlt2,
} from "react-icons/hi";
import KpiCard from "../ui/KpiCard";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState("30");

  // 🔹 Mock KPI data (replace with API response)
  const kpis = {
    totalProperties: 12,
    activeListings: 8,
    pendingListings: 4,
    totalViews: 2340,
    totalClicks: 620,
    totalInquiries: 47,
  };

  return (
    <div className="container mx-auto p-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Agent Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Track your property performance and leads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="180">Last 6 months</option>
          </select>
        </div>
      </div>

      {/* ================= KPI GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          title="Total Properties"
          value={kpis.totalProperties}
          icon={<HiHome size={22} className="text-blue-600" />}
          bgColor="#F5F9FF"
          iconBgColor="#E0ECFF"
        />

        <KpiCard
          title="Active Listings"
          value={kpis.activeListings}
          icon={<HiCheckCircle size={22} className="text-green-600" />}
          bgColor="#F3FBF7"
          iconBgColor="#DFF4E8"
        />

        <KpiCard
          title="Pending Listings"
          value={kpis.pendingListings}
          icon={<HiClock size={22} className="text-orange-600" />}
          bgColor="#FFF7ED"
          iconBgColor="#FFE7CC"
        />

        <KpiCard
          title="Total Views"
          value={kpis.totalViews}
          icon={<HiEye size={22} className="text-purple-600" />}
          bgColor="#F8F5FF"
          iconBgColor="#ECE6FF"
        />

        <KpiCard
          title="Total Clicks"
          value={kpis.totalClicks}
          icon={<HiCursorClick size={22} className="text-indigo-600" />}
          bgColor="#F5F7FF"
          iconBgColor="#E4E8FF"
        />

        <KpiCard
          title="Total Inquiries"
          value={kpis.totalInquiries}
          icon={<HiChatAlt2 size={22} className="text-pink-600" />}
          bgColor="#FFF5F7"
          iconBgColor="#FFE4EC"
        />
      </div>
    </div>
  );
};

export default Dashboard;
