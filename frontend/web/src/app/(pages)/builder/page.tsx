"use client";
import { getBuilderDashboards } from "@/data/ClientData";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../agent/ui/KpiCard";
import { HiHome } from "react-icons/hi2";
import {
  MdOutlineCheckCircle,
  MdOutlinePendingActions,
  MdOutlineStar,
} from "react-icons/md";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HiTrendingUp } from "react-icons/hi";

type FeaturedSplitItem = {
  _id: boolean;
  count: number;
};

type StatusItem = {
  _id: string;
  count: number;
};

type TopViewedItem = {
  _id: string;
  title: string;
  city: string;
  isFeatured: boolean;
  meta?: {
    views?: number;
  };
};

type LocationData = {
  cities: {
    _id: { city: string };
    count: number;
  }[];
  states: {
    _id: string;
    total: number;
    featured: number;
  }[];
};

type BuilderDashboardResponse = {
  totals: {
    projects: number;
  };
  featuredSplit: FeaturedSplitItem[];
  status: StatusItem[];
  topViewed: TopViewedItem[];
  location?: LocationData;
};

const Dashboard = () => {
  const { data, error, isLoading } = useQuery<BuilderDashboardResponse>({
    queryKey: ["DashboardData"],
    queryFn: getBuilderDashboards,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;

  const activeCount = data?.status?.find((s) => s._id === "active")?.count ?? 0;

  const pendingCount = data?.status?.find((s) => s._id === "pending")?.count ?? 0;
    const featuredCount =data?.featuredSplit?.find((f) => f._id === true)?.count ?? 0;

  const kpis = {
    totalProperties: data?.totals?.projects ?? 0,
    featuredProperties: data?.featuredSplit?.length ?? 0,
    activeListings: activeCount,
    pendingListings: pendingCount,
  };


  const nonFeaturedCount =
    data?.featuredSplit?.find((f) => f._id === false)?.count ?? 0;

  const featuredPieData = [
    { name: "Featured Listings", value: featuredCount },
    { name: "Non-Featured Listings", value: nonFeaturedCount },
  ];


  const cityChartData =
    data?.location?.cities?.map((item) => ({
      city: item._id.city,
      listings: item.count,
    })) ?? [];

  const stateChartData =
    data?.location?.states?.map((item) => ({
      state: item._id,
      total: item.total,
      featured: item.featured,
    })) ?? [];


  return (
    <div className="mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Builder Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Track your property performance and leads
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Projects"
          value={kpis.totalProperties}
          icon={<HiHome size={22} className="text-blue-600" />}
          bgColor="#F5F9FF"
          iconBgColor="#E0ECFF"
        />

        <KpiCard
          title="Active Listings"
          value={kpis.activeListings}
          icon={<MdOutlineCheckCircle size={22} className="text-green-600" />}
          bgColor="#F3FBF7"
          iconBgColor="#DFF4E8"
        />
        <KpiCard
          title="Featured"
          value={kpis.featuredProperties}
          icon={<MdOutlineStar size={22} className="text-yellow-600" />}
          bgColor="#FFF7ED"
          iconBgColor="#FFE7CC"
        />
        <KpiCard
          title="Pending Listings"
          value={kpis.pendingListings}
          icon={<MdOutlinePendingActions size={22} className="text-red-600" />}
          bgColor="#FFF5F5"
          iconBgColor="#FFEBEB"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    Featured Split
  </h2>

  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={featuredPieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
        >
          <Cell fill="#22C55E" /> {/* Featured */}
          <Cell fill="#94A3B8" /> {/* Non-Featured */}
        </Pie>

        <Tooltip />
        <Legend verticalAlign="bottom" />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>


        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
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
                <Bar
                  dataKey="listings"
                  fill="#3B82F6" // blue
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Listings by State
            </h2>
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

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-green-600 text-lg"><HiTrendingUp className="text-green-600 text-lg" /></span>
            <h2 className="text-lg font-semibold text-gray-900">
              Top Viewed Projects
            </h2>
          </div>

          {/* List */}
          <div className="space-y-6">
            {data?.topViewed?.map((item, index) => (
              <div
                key={item._id}
                className="flex items-center justify-between"
              >
                {/* Left side */}
                <div className="flex items-center gap-4">
                  {/* Index */}
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 font-medium">
                    {index + 1}
                  </div>

                  {/* Title & city */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {item.title}
                      </h3>

                      {item.isFeatured && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500">
                      {item.city}
                    </p>
                  </div>
                </div>

                {/* Right side */}
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
