"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HiHome,
  HiCheckCircle,
  HiClock,
  HiEye,
  HiCursorClick,
  HiChatAlt2,
} from "react-icons/hi";

import KpiCard from "../ui/KpiCard";
import HorizontalBarChart from "../ui/HorizontalBarChart";
import { getMyAgentProfile } from "../data";
import Dropdownui from "@/ui/DropDownUI";
import PieChartcard from "../ui/PieChart";
import TopPropertiesTable from "../ui/TopPropertiesTable";

/* ================= CONSTANTS ================= */

const DATE_RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 6 months", value: "180" },
];

/* ================= COMPONENT ================= */

const Dashboard = () => {
  const [dateRange, setDateRange] = useState("30");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["myAgentProfile", dateRange],
    queryFn: () => getMyAgentProfile(dateRange),
    staleTime: 1000 * 60 * 5,
  });

  /* ================= SAFE LOGGING ================= */
  useEffect(() => {
    if (!data) return;
  }, [data]);

  /* ================= STATES ================= */

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-64 flex items-center justify-center text-red-500">
        {(error as Error)?.message || "Failed to load dashboard"}
      </div>
    );
  }

  /* ================= KPI DATA ================= */

  const kpis = {
    totalProperties: data?.kpis?.totalProperties ?? 0,
    activeListings: data?.kpis?.activeListings ?? 0,
    pendingListings: data?.kpis?.pendingListings ?? 0,
    totalViews: data?.kpis?.totalViews ?? 0,
    totalClicks: data?.kpis?.totalClicks ?? 0,
    totalInquiries: data?.kpis?.totalInquiries ?? 0,
  };

  const barChartData = useMemo(() => {
    if (!Array.isArray(data?.charts?.byCity)) return [];
    return data.charts.byCity.map((item: any) => ({
      name: item.city,
      value: item.count,
    }));
  }, [data]);
  const propertyTypePie = useMemo(() => {
    return [
      { name: "Residential", value: data?.stats?.residential ?? 10 },
      { name: "Commercial", value: data?.stats?.commercial ?? 5 },
      { name: "Plot", value: data?.stats?.plot ?? 2 },
      { name: "Agricultural", value: data?.stats?.agricultural ?? 1 },
    ].filter((item) => item.value > 0); // remove zero values
  }, [data]);

  const topProperties = useMemo(() => {
    return (
      data?.topProperties?.map((p: any) => ({
        _id: p._id,
        title: p.title,
        city: p.city,
        image: p.gallery?.[0]?.url,
        views: p.meta?.views ?? 0,
        inquiries: p.meta?.inquiries ?? 0,
      })) ?? []
    );
  }, [data]);

  return (
    <div className="mx-auto w-full">
      {/* ================= HEADER ================= */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
            Agent Analytics Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track your property performance and leads
          </p>
        </div>

        <div className="flex w-full md:w-auto flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-sm text-gray-600 whitespace-nowrap">
            Date Range:
          </span>

          <div className="w-full sm:w-48 md:w-40">
            <Dropdownui
              label=""
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select range"
              options={DATE_RANGE_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* ================= KPI GRID ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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

      {/* ================= ANALYTICS GRID ================= */}
      <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* ================= PROPERTY TYPE PIE ================= */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Property Type Distribution
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Residential vs Commercial vs Plot vs Agricultural
          </p>

          {propertyTypePie.length > 0 ? (
            <PieChartcard data={propertyTypePie} />
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No property type data available
            </div>
          )}
        </div>

        {/* ================= TOP CITIES BAR ================= */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Cities by Views
            </h2>
            <p className="text-sm text-gray-500">
              Performance of your listings across different cities
            </p>
          </div>

          {barChartData.length > 0 ? (
            <HorizontalBarChart data={barChartData} />
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No city data available for selected range
            </div>
          )}
        </div>
      </div>
      {/* ================= Top Properties Table ================= */}
      <div className="mt-8 sm:mt-10 overflow-hidden rounded-xl">
        <TopPropertiesTable properties={topProperties} />
      </div>
    </div>
  );
};

export default Dashboard;
