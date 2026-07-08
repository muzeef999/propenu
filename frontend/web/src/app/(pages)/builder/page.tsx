"use client";

import { useMemo, useState } from "react";
import { getBuilderDashboards } from "@/data/ClientData";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../agent/ui/KpiCard";
import Dropdownui from "@/ui/DropDownUI";
import { HiHome, HiTrendingUp } from "react-icons/hi";
import { HiBuildingOffice2, HiCheckCircle } from "react-icons/hi2";
import { MdOutlineStar } from "react-icons/md";
import { FiEye, FiMapPin, FiUsers, FiTarget } from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TopViewedItem = {
  _id: string;
  title: string;
  city: string;
  state?: string;
  status?: string;
  createdAt?: string;
  meta?: {
    views?: number;
    inquiries?: number;
    clicks?: number;
  };
};

type LocationBucket = {
  _id: string;
  count: number;
};

type TrendPoint = {
  label: string;
  count: number;
};

type BuilderDashboardResponse = {
  builderSummary: {
    totalProjects: number;
    totalViews: number;
    featuredProjects: number;
    primeProjects?: number;
    sponsoredProjects?: number;
    totalShortlists: number;
    totalLeads: number;
    totalInquiries: number;
    averageViewsPerProject: number;
    averageShortlistsPerProject: number;
    averageLeadsPerProject: number;
  };
  statusSummary?: {
    active: number;
    inactive: number;
    archived: number;
  };
  engagementSummary?: {
    totalViews: number;
    totalShortlists: number;
    totalLeads: number;
    totalInquiries: number;
    averageViewsPerProject: number;
    averageShortlistsPerProject: number;
    averageLeadsPerProject: number;
  };
  locationStats: {
    cities: LocationBucket[];
    states: LocationBucket[];
  };
  filterOptions?: {
    states?: string[];
    citiesByState?: Record<string, string[]>;
  };
  trendStats?: {
    range?: string;
    projectsCreated?: TrendPoint[];
    shortlists?: TrendPoint[];
    leads?: TrendPoint[];
  };
  topViewed: TopViewedItem[];
};

const CITY_BAR_COLORS = ["#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"];
const STATUS_COLORS = {
  active: "#16A34A",
  inactive: "#F59E0B",
  archived: "#64748B",
};
const DATE_RANGE_OPTIONS = [
  { label: "Today", value: "1d" },
  { label: "This Week", value: "7d" },
  { label: "This Month", value: "30d" },
];
const ALL_STATES_VALUE = "__all_states__";
const ALL_CITIES_VALUE = "__all_cities__";

const formatNumber = (value: number) => value.toLocaleString();

const sortByCountDesc = <T extends { count?: number; total?: number; listings?: number }>(items: T[]) =>
  [...items].sort((a, b) => {
    const left = a.count ?? a.total ?? a.listings ?? 0;
    const right = b.count ?? b.total ?? b.listings ?? 0;
    return right - left;
  });

const EmptyChartState = ({ message }: { message: string }) => (
  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 text-center text-sm text-gray-500">
    {message}
  </div>
);

const StatusCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
    </div>
    <p className="text-2xl font-semibold text-gray-900">{formatNumber(value)}</p>
  </div>
);

const Dashboard = () => {
  const [dateRange, setDateRange] = useState("30d");
  const [selectedState, setSelectedState] = useState(ALL_STATES_VALUE);
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES_VALUE);
  const { data, error, isLoading, isError } = useQuery<BuilderDashboardResponse | null>({
    queryKey: ["builder-dashboard", dateRange, selectedState, selectedCity],
    queryFn: () =>
      getBuilderDashboards(dateRange, {
        state: selectedState !== ALL_STATES_VALUE ? selectedState : undefined,
        city: selectedCity !== ALL_CITIES_VALUE ? selectedCity : undefined,
      }),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  const summary = data?.builderSummary;
  const statusSummary = data?.statusSummary ?? { active: 0, inactive: 0, archived: 0 };

  const totalProjects = summary?.totalProjects ?? 0;
  const totalViews = summary?.totalViews ?? 0;
  const featuredProjects = summary?.featuredProjects ?? 0;
  const primeProjects = summary?.primeProjects ?? 0;
  const sponsoredProjects = summary?.sponsoredProjects ?? 0;
  const totalShortlists = summary?.totalShortlists ?? 0;
  const totalLeads = summary?.totalLeads ?? 0;
  const totalInquiries = summary?.totalInquiries ?? 0;
  const averageViewsPerProject = summary?.averageViewsPerProject ?? 0;
  const averageShortlistsPerProject = summary?.averageShortlistsPerProject ?? 0;
  const averageLeadsPerProject = summary?.averageLeadsPerProject ?? 0;
  const featuredShare = totalProjects > 0 ? Math.round((featuredProjects / totalProjects) * 100) : 0;
  const states = data?.filterOptions?.states ?? [];
  const citiesByState = data?.filterOptions?.citiesByState ?? {};
  const stateOptions = [
    { label: "All States", value: ALL_STATES_VALUE },
    ...states.map((state) => ({ label: state, value: state })),
  ];
  const cityPool =
    selectedState !== ALL_STATES_VALUE
      ? (citiesByState[selectedState] ?? [])
      : Object.values(citiesByState).flat();
  const cityOptions = [
    { label: "All Cities", value: ALL_CITIES_VALUE },
    ...Array.from(new Set(cityPool))
      .sort((left, right) => left.localeCompare(right))
      .map((city) => ({ label: city, value: city })),
  ];

  const cityChartData =
    sortByCountDesc(
      data?.locationStats?.cities?.map((item) => ({
        city: item._id || "Unknown",
        listings: item.count,
      })) ?? [],
    );

  const stateChartData =
    sortByCountDesc(
      data?.locationStats?.states?.map((item) => ({
        state: item._id || "Unknown",
        total: item.count,
      })) ?? [],
    );

  const topViewedProjects =
    data?.topViewed?.map((item) => {
      const views = item.meta?.views ?? 0;
      const inquiries = item.meta?.inquiries ?? 0;
      const clicks = item.meta?.clicks ?? 0;

      return {
        ...item,
        views,
        clicks,
        inquiries,
        viewShare: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
      };
    }) ?? [];

  const totalClicks = topViewedProjects.reduce((sum, item) => sum + item.clicks, 0);

  const topCity = cityChartData[0];
  const topState = stateChartData[0];
  const leadingProject = topViewedProjects[0];
  const hasViewData = totalViews > 0;
  const primaryMarket =
    topCity && topState ? `${topCity.city}, ${topState.state}` : topCity?.city ?? topState?.state ?? "No data";

  const trendData = useMemo(() => {
    const projectTrend = data?.trendStats?.projectsCreated ?? [];
    const shortlistTrend = data?.trendStats?.shortlists ?? [];
    const leadTrend = data?.trendStats?.leads ?? [];
    const length = Math.max(projectTrend.length, shortlistTrend.length, leadTrend.length);

    return Array.from({ length }, (_, index) => ({
      label:
        projectTrend[index]?.label ??
        shortlistTrend[index]?.label ??
        leadTrend[index]?.label ??
        "",
      projects: projectTrend[index]?.count ?? 0,
      shortlists: shortlistTrend[index]?.count ?? 0,
      leads: leadTrend[index]?.count ?? 0,
    }));
  }, [data]);

  const hasTrendData = trendData.some(
    (item) => item.projects > 0 || item.shortlists > 0 || item.leads > 0,
  );

  const engagementCards = [
    {
      title: "Total Shortlists",
      value: totalShortlists,
      icon: <FiUsers size={22} className="text-sky-600" />,
      bgColor: "#F3FAFF",
      iconBgColor: "#DDF0FF",
    },
    {
      title: "Total Leads",
      value: totalLeads,
      icon: <FiTarget size={22} className="text-rose-600" />,
      bgColor: "#FFF4F6",
      iconBgColor: "#FFE1E8",
    },
    {
      title: "Prime Projects",
      value: primeProjects,
      icon: <MdOutlineStar size={22} className="text-fuchsia-600" />,
      bgColor: "#FCF4FF",
      iconBgColor: "#F4E1FF",
    },
    {
      title: "Sponsored Projects",
      value: sponsoredProjects,
      icon: <HiBuildingOffice2 size={22} className="text-teal-600" />,
      bgColor: "#F1FCFA",
      iconBgColor: "#D8F5EF",
    },
  ];

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity(ALL_CITIES_VALUE);
  };

  return (
    <div className="mx-auto w-full">
      {isError && error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Unable to load builder dashboard data: {(error as Error).message}
        </div>
      )}
      {!isError && !data && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          No builder dashboard data is available for the selected range yet.
        </div>
      )}
      <div className="mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="mb-1 text-xl font-semibold text-gray-900 sm:text-2xl">
            Builder Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Monitor project reach, engagement signals, and portfolio health across your builder inventory.
          </p>
          <div className="mt-5 grid w-full gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:items-start">
            <div className="overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-emerald-50 shadow-[0_12px_32px_rgba(14,165,233,0.08)]">
              <div className="border-b border-white/70 px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/80">
                  Market Snapshot
                </p>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/75 p-3 shadow-sm ring-1 ring-white/70">
                  <div className="mb-2 flex items-center gap-2 text-sky-700">
                    <FiMapPin size={15} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Primary City
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{topCity?.city ?? "No data"}</p>
                </div>

                <div className="rounded-2xl bg-white/75 p-3 shadow-sm ring-1 ring-white/70">
                  <div className="mb-2 flex items-center gap-2 text-emerald-700">
                    <HiBuildingOffice2 size={15} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Primary State
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{topState?.state ?? "No data"}</p>
                </div>

                <div className="rounded-2xl bg-white/75 p-3 shadow-sm ring-1 ring-white/70">
                  <div className="mb-2 flex items-center gap-2 text-rose-600">
                    <FiTarget size={15} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Total Leads
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatNumber(totalLeads)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-900">Filter Insights</p>
                <p className="text-xs text-gray-500">Narrow analytics by market and time range.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="w-full">
                  <Dropdownui
                    label="State"
                    value={selectedState}
                    onChange={handleStateChange}
                    placeholder="Select state"
                    options={stateOptions}
                  />
                </div>
                <div className="w-full">
                  <Dropdownui
                    label="City"
                    value={selectedCity}
                    onChange={setSelectedCity}
                    placeholder="Select city"
                    options={cityOptions}
                  />
                </div>
                <div className="w-full">
                  <Dropdownui
                    label="Range"
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Select range"
                    options={DATE_RANGE_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
        <KpiCard
          title="Total Projects"
          value={formatNumber(totalProjects)}
          icon={<HiHome size={22} className="text-blue-600" />}
          bgColor="#F5F9FF"
          iconBgColor="#E0ECFF"
        />
        <KpiCard
          title="Total Views"
          value={formatNumber(totalViews)}
          icon={<FiEye size={22} className="text-emerald-600" />}
          bgColor="#F3FBF7"
          iconBgColor="#DFF4E8"
        />
        <KpiCard
          title="Featured Projects"
          value={formatNumber(featuredProjects)}
          icon={<MdOutlineStar size={22} className="text-amber-600" />}
          bgColor="#FFF7ED"
          iconBgColor="#FFE7CC"
        />
        <KpiCard
          title="Avg Views / Project"
          value={formatNumber(averageViewsPerProject)}
          icon={<HiTrendingUp size={22} className="text-indigo-600" />}
          bgColor="#F5F7FF"
          iconBgColor="#E4E8FF"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
        {engagementCards.map((card) => (
          <KpiCard
            key={card.title}
            title={card.title}
            value={typeof card.value === "number" ? formatNumber(card.value) : card.value}
            icon={card.icon}
            bgColor={card.bgColor}
            iconBgColor={card.iconBgColor}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Portfolio Snapshot</h2>
              <p className="text-sm text-gray-500">
                Builder overview for the selected date range.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 p-2 text-blue-600">
              <HiBuildingOffice2 size={18} />
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Featured Coverage</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold text-gray-900">{featuredShare}%</p>
                <p className="text-sm text-gray-500">
                  {formatNumber(featuredProjects)} of {formatNumber(totalProjects)} projects
                </p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-amber-400"
                  style={{ width: `${Math.min(featuredShare, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500">
                  <FiMapPin size={15} />
                  <p className="text-sm">Primary Market</p>
                </div>
                <p className="text-base font-semibold text-gray-900">{primaryMarket}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {topCity
                    ? `${formatNumber(topCity.listings)} project${topCity.listings === 1 ? "" : "s"} in the top city`
                    : "No location analytics available"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-gray-500">
                  <HiTrendingUp size={15} />
                  <p className="text-sm">Visibility Leader</p>
                </div>
                <p className="line-clamp-1 text-base font-semibold text-gray-900">
                  {leadingProject?.title ?? "No data"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {leadingProject
                    ? hasViewData
                      ? `${formatNumber(leadingProject.views)} views in ${leadingProject.city}`
                      : `Listed in ${leadingProject.city} with no recorded views yet`
                    : "No project visibility data available"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatusCard label="Active" value={statusSummary.active} color={STATUS_COLORS.active} />
              <StatusCard label="Inactive" value={statusSummary.inactive} color={STATUS_COLORS.inactive} />
              <StatusCard label="Archived" value={statusSummary.archived} color={STATUS_COLORS.archived} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Engagement Trend</h2>
            <p className="text-sm text-gray-500">
              Compare project creation, shortlist activity, and lead generation across the selected range.
            </p>
          </div>

          <div className="h-80">
            {hasTrendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="projects" stroke="#2563EB" strokeWidth={3} dot={false} name="Projects" />
                  <Line type="monotone" dataKey="shortlists" stroke="#0EA5E9" strokeWidth={3} dot={false} name="Shortlists" />
                  <Line type="monotone" dataKey="leads" stroke="#F43F5E" strokeWidth={3} dot={false} name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No trend activity is available for this date range yet." />
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Projects by City</h2>
            <p className="text-sm text-gray-500">
              Geographic concentration of your builder inventory.
            </p>
          </div>

          <div className="h-80">
            {cityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityChartData} barSize={42}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="city" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#F9FAFB" }} />
                  <Bar dataKey="listings" radius={[8, 8, 0, 0]}>
                    {cityChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.city}-${index}`}
                        fill={CITY_BAR_COLORS[index % CITY_BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No city distribution data is available for this builder yet." />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Engagement Mix</h2>
            <p className="text-sm text-gray-500">
              Snapshot of visibility and response metrics.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-500">Shortlists / Project</p>
                <p className="font-semibold text-gray-900">
                  {averageShortlistsPerProject}
                </p>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-sky-500"
                  style={{ width: `${Math.min(averageShortlistsPerProject * 20, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-500">Leads / Project</p>
                <p className="font-semibold text-gray-900">{averageLeadsPerProject}</p>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-rose-500"
                  style={{ width: `${Math.min(averageLeadsPerProject * 20, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-500">Inquiries</p>
                <p className="font-semibold text-gray-900">{formatNumber(totalInquiries)}</p>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(totalInquiries * 10, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <HiCheckCircle size={16} />
                <p className="text-sm font-medium">Performance Pulse</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                {totalLeads > 0 || totalShortlists > 0 || totalClicks > 0
                  ? `You have ${formatNumber(totalShortlists)} shortlists, ${formatNumber(totalLeads)} leads, and ${formatNumber(totalClicks)} clicks in this range.`
                  : "Your builder portfolio is live, but there is no shortlist, lead, or click activity recorded in this range yet."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Projects by State</h2>
            <p className="text-sm text-gray-500">
              State-level spread of your builder projects.
            </p>
          </div>

          <div className="h-80">
            {stateChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateChartData} layout="vertical" barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="state"
                    type="category"
                    width={90}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip cursor={{ fill: "#F9FAFB" }} />
                  <Bar dataKey="total" fill="#0F766E" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No state distribution data is available for this builder yet." />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <HiTrendingUp size={18} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Viewed Projects</h2>
              <p className="text-sm text-gray-500">
                Project-level visibility leaderboard for the selected range.
              </p>
            </div>
          </div>

          {topViewedProjects.length > 0 ? (
            <div className="space-y-4">
              {topViewedProjects.map((item, index) => (
                <div key={item._id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 font-medium text-gray-700">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="line-clamp-1 font-medium text-gray-900">{item.title}</h3>
                          {item.status && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor:
                                  item.status === "active"
                                    ? "#DCFCE7"
                                    : item.status === "inactive"
                                      ? "#FEF3C7"
                                      : "#E2E8F0",
                                color:
                                  item.status === "active"
                                    ? "#166534"
                                    : item.status === "inactive"
                                      ? "#92400E"
                                      : "#334155",
                              }}
                            >
                              {item.status}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {[item.city, item.state].filter(Boolean).join(", ") || "Unknown location"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatNumber(item.views)}</p>
                      <p className="text-sm text-gray-500">views</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">Clicks</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatNumber(item.clicks)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">Inquiries</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatNumber(item.inquiries)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">View Share</p>
                      <p className="mt-1 font-semibold text-gray-900">{item.viewShare}%</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    {hasViewData ? (
                      <>
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                          <span>Share of total views</span>
                          <span>{item.viewShare}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(item.viewShare, 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">
                        No recorded project views yet, so visibility share is not available.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState message="No top viewed projects are available yet." />
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pipeline Momentum</h2>
          <p className="text-sm text-gray-500">
            Shortlists and leads moving through your builder funnel.
          </p>
        </div>

        <div className="h-80">
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="shortlistGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="shortlists" stroke="#0EA5E9" fill="url(#shortlistGradient)" strokeWidth={2.5} name="Shortlists" />
                <Area type="monotone" dataKey="leads" stroke="#F43F5E" fill="url(#leadGradient)" strokeWidth={2.5} name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState message="No shortlist or lead movement is available for this date range yet." />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
