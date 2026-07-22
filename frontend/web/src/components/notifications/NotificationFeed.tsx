"use client";

import { useMemo, useState } from "react";
import { FiBell, FiFilter, FiSearch } from "react-icons/fi";

import NopropertiesSvg from "@/svg/NopropertiesSvg";

export type NotificationType =
  | "project_shortlisted"
  | "property_shortlisted"
  | "contact_requested"
  | "brochure_downloaded"
  | "high_time_spent";

type FilterType = "all" | NotificationType;

export interface NotificationUser {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  userCode?: string;
}

export interface NotificationProject {
  id?: string;
  title?: string;
  slug?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  createdAt?: string | null;
  user?: NotificationUser;
  project?: NotificationProject;
  message?: string;
  timeSpentMinutes?: number | null;
}

export interface NotificationSummary {
  total?: number;
  shortlists?: number;
  contacts?: number;
  brochureDownloads?: number;
  timeSpent?: number;
}

interface NotificationFeedProps {
  description: string;
  error?: unknown;
  isError: boolean;
  isLoading: boolean;
  notifications: NotificationItem[];
  summary?: NotificationSummary;
  title?: string;
}

const FILTERS: Array<{ id: FilterType; label: string }> = [
  { id: "all", label: "All" },
  { id: "project_shortlisted", label: "Project Shortlists" },
  { id: "property_shortlisted", label: "Property Shortlists" },
  { id: "contact_requested", label: "Contacts" },
  { id: "brochure_downloaded", label: "Brochure" },
  { id: "high_time_spent", label: "Time Spent" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "NA";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "NA";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatMinutes = (value?: number | null) => {
  if (value == null || value <= 0) return "NA";
  if (value < 1) return "< 1 min";
  if (Number.isInteger(value)) return `${value} min`;
  return `${value.toFixed(1)} min`;
};

const getRoleLabel = (role?: string) => {
  const normalized = role?.toLowerCase().trim();

  if (normalized === "sales_agent" || normalized === "agent") return "Agent";
  if (normalized === "builder" || normalized === "builder_staff") return "Builder";
  if (normalized === "user") return "User";

  return role || "User";
};

const getNotificationAccentClasses = (type: NotificationType) => {
  switch (type) {
    case "brochure_downloaded":
      return "bg-violet-50 text-violet-700 ring-violet-100";
    case "high_time_spent":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "contact_requested":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "property_shortlisted":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "project_shortlisted":
    default:
      return "bg-blue-50 text-blue-700 ring-blue-100";
  }
};

const getNotificationLabel = (type: NotificationType) => {
  switch (type) {
    case "brochure_downloaded":
      return "Brochure";
    case "high_time_spent":
      return "Time Spent";
    case "contact_requested":
      return "Contact Request";
    case "property_shortlisted":
      return "Property Shortlisted";
    case "project_shortlisted":
    default:
      return "Project Shortlisted";
  }
};

const NotificationFeed = ({
  description,
  error,
  isError,
  isLoading,
  notifications,
  summary,
  title = "Notifications",
}: NotificationFeedProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchValue, setSearchValue] = useState("");

  const availableFilters = useMemo(
    () =>
      FILTERS.filter(
        (filter) =>
          filter.id === "all" ||
          notifications.some((item) => item.type === filter.id),
      ),
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return notifications.filter((item) => {
      const userName = item.user?.name || "";
      const userPhone = item.user?.phone || "";
      const userCode = item.user?.userCode || "";
      const projectTitle = item.project?.title || "";
      const message = item.message || "";

      const matchesFilter = activeFilter === "all" || item.type === activeFilter;
      const matchesSearch =
        !query ||
        userName.toLowerCase().includes(query) ||
        userPhone.toLowerCase().includes(query) ||
        userCode.toLowerCase().includes(query) ||
        projectTitle.toLowerCase().includes(query) ||
        message.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, notifications, searchValue]);

  const resolvedSummary = {
    total: summary?.total ?? notifications.length,
    shortlists:
      summary?.shortlists ??
      notifications.filter(
        (item) =>
          item.type === "project_shortlisted" || item.type === "property_shortlisted",
      ).length,
    contacts:
      summary?.contacts ??
      notifications.filter((item) => item.type === "contact_requested").length,
    brochureDownloads:
      summary?.brochureDownloads ??
      notifications.filter((item) => item.type === "brochure_downloaded").length,
    timeSpent:
      summary?.timeSpent ??
      notifications.filter((item) => item.type === "high_time_spent").length,
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500">
        Loading notifications...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 text-center text-red-600">
        Error: {error instanceof Error ? error.message : "Failed to load notifications"}
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">{description}</p>
        </div>

        <div className="rounded-2xl border border-[#E4ECE7] bg-white py-14 text-center text-gray-500">
          <div className="flex justify-center">
            <NopropertiesSvg />
          </div>
          <p className="mt-4 text-base font-medium text-gray-700">
            No notifications found yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-6">
      <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">{description}</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#21884B]">
            <FiBell className="h-4 w-4" />
            <span>{resolvedSummary.total} notifications</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">All Notifications</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{resolvedSummary.total}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">Shortlists</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{resolvedSummary.shortlists}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">Contacts</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{resolvedSummary.contacts}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">Brochure / Time</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {resolvedSummary.brochureDownloads + resolvedSummary.timeSpent}
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {availableFilters.map((filter) => {
                const isActive = activeFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#26ad5f] text-white"
                        : "bg-[#F6FBF8] text-gray-600 hover:bg-[#EAF6EE]"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative min-w-0 flex-1 lg:w-80">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search user, phone, code, property..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#26ad5f]"
                />
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500">
                <FiFilter className="h-4 w-4" />
                <span>{filteredNotifications.length} shown</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left">
            <thead className="bg-[#F8FBF9]">
              <tr className="text-sm text-gray-500">
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">User</th>
                <th className="px-5 py-4 font-medium">Contact Detail</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Project</th>
                <th className="px-5 py-4 font-medium">Message</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredNotifications.map((item) => (
                <tr key={item.id} className="transition hover:bg-[#FCFDFD]">
                  <td className="px-5 py-4 text-sm text-gray-700">
                    <p>{formatDate(item.createdAt)}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatTime(item.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">
                        {item.user?.name || "You"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.user?.userCode || "No code"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        {item.user?.email || "No email"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.user?.phone || "No phone"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#F3FBF6] px-3 py-1 text-xs font-semibold text-[#21884B]">
                      {getRoleLabel(item.user?.role)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">
                      {item.project?.title || "Untitled Project"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getNotificationAccentClasses(
                            item.type,
                          )}`}
                        >
                          {getNotificationLabel(item.type)}
                        </span>
                        {item.type === "high_time_spent" &&
                        item.timeSpentMinutes &&
                        item.timeSpentMinutes > 0 ? (
                          <span className="inline-flex rounded-full bg-[#F6FBF8] px-2.5 py-1 text-[11px] font-semibold text-[#21884B]">
                            {formatMinutes(item.timeSpentMinutes)}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm font-medium leading-6 text-gray-800">
                        {item.message || "No message"}
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotificationFeed;
