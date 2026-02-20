"use client";

import { getBuilderDashboards } from "@/data/ClientData";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../agent/ui/KpiCard";
import { HiHome } from "react-icons/hi2";
import {  MdOutlineStar } from "react-icons/md";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HiTrendingUp } from "react-icons/hi";
import { FiEye } from "react-icons/fi";

type TopViewedItem = {
  _id: string;
  title: string;
  city: string;
  isFeatured?: boolean;
  meta?: {
    views?: number;
  };
};

type LocationStats = {
  cities: {
    _id: string;
    count: number;
  }[];
  states: {
    _id: string;
    count: number;
  }[];
};

type BuilderDashboardResponse = {
  builderSummary: {
    totalProjects: number;
    totalViews: number;
    featuredProjects: number;
  };
  locationStats: LocationStats;
  topViewed: TopViewedItem[];
};

const Dashboard = () => {
  const { data, error, isLoading } = useQuery<BuilderDashboardResponse>({
    queryKey: ["DashboardData"],
    queryFn: getBuilderDashboards,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;

  const kpis = {
    totalProjects: data?.builderSummary?.totalProjects ?? 0,
    featuredProjects: data?.builderSummary?.featuredProjects ?? 0,
    totalViews: data?.builderSummary?.totalViews ?? 0,
  };

  const cityChartData =
    data?.locationStats?.cities?.map((item) => ({
      city: item._id,
      listings: item.count,
    })) ?? [];

  const stateChartData =
    data?.locationStats?.states?.map((item) => ({
      state: item._id,
      total: item.count,
    })) ?? [];

  return (
    <div className="mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">
            Builder Analytics Dashboard
          </h1>
          <p className="text-gray-600">Track your property performance and leads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Projects"
          value={kpis.totalProjects}
          icon={<HiHome size={22} className="text-blue-600" />}
          bgColor="#F5F9FF"
          iconBgColor="#E0ECFF"
        />
        <KpiCard
          title="Total Views"
          value={kpis.totalViews}
          icon={<FiEye size={22} className="text-green-600" />}
          bgColor="#F3FBF7"
          iconBgColor="#DFF4E8"
        />
        <KpiCard
          title="Featured Projects"
          value={kpis.featuredProjects}
          icon={<MdOutlineStar size={22} className="text-yellow-600" />}
          bgColor="#FFF7ED"
          iconBgColor="#FFE7CC"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Cities</h2>
            <p className="text-sm text-gray-500">
              Performance of your listings across different cities
            </p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="city" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="listings" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Listings by State</h2>
            <p className="text-sm text-gray-500">
              Total listings distribution across states
            </p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateChartData} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="state" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="total" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="text-lg text-green-600">
              <HiTrendingUp className="text-lg text-green-600" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Top Viewed Projects</h2>
          </div>

          <div className="space-y-6">
            {data?.topViewed?.map((item, index) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 font-medium text-gray-700">
                    {index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>

                      {item.isFeatured && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Featured
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">{item.city}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {item.meta?.views?.toLocaleString() ?? 0}
                  </p>
                  <p className="text-sm text-gray-500">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
