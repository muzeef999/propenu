"use client";

import { useEffect, useMemo, useState } from "react";
import { FiBell, FiFilter, FiSearch } from "react-icons/fi";

import NopropertiesSvg from "@/svg/NopropertiesSvg";

export type NotificationType =
  | "project_shortlisted"
  | "property_shortlisted"
  | "contact_requested"
  | "brochure_downloaded"
  | "high_time_spent"
  | "ticket_created";

type FilterType = "all" | NotificationType;
type DateRangeFilter = "all" | "today" | "last_7_days" | "this_month";

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
  unread?: number;
  shortlists?: number;
  contacts?: number;
  brochureDownloads?: number;
  timeSpent?: number;
  tickets?: number;
}

interface NotificationFeedProps {
  containerClassName?: string;
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
  { id: "ticket_created", label: "Tickets" },
  { id: "brochure_downloaded", label: "Brochure" },
  { id: "high_time_spent", label: "Time Spent" },
];

const DATE_FILTERS: Array<{ id: DateRangeFilter; label: string }> = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "this_month", label: "This Month" },
];

const SUMMARY_CARD_LAYOUTS = [
  "col-span-2",
  "col-span-2",
  "col-span-2",
  "col-span-3",
  "col-span-3",
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

const getNotificationTimestamp = (value?: string | null) => {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const isWithinDateRange = (value: string | null | undefined, filter: DateRangeFilter) => {
  if (filter === "all") return true;
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "today") {
    return date >= startOfToday;
  }

  if (filter === "last_7_days") {
    const startOfLast7Days = new Date(startOfToday);
    startOfLast7Days.setDate(startOfLast7Days.getDate() - 6);
    return date >= startOfLast7Days;
  }

  if (filter === "this_month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= startOfMonth;
  }

  return true;
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
    case "ticket_created":
      return "bg-orange-50 text-orange-700 ring-orange-100";
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
    case "ticket_created":
      return "Ticket";
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
  containerClassName,
  description,
  error,
  isError,
  isLoading,
  notifications,
  summary,
  title = "Notifications",
}: NotificationFeedProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeDateFilter, setActiveDateFilter] = useState<DateRangeFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const availableFilters = useMemo(
    () =>
      FILTERS.filter(
        (filter) =>
          filter.id === "all" ||
          notifications.some((item) => item.type === filter.id),
      ),
    [notifications],
  );

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          getNotificationTimestamp(b.createdAt) -
          getNotificationTimestamp(a.createdAt),
      ),
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return sortedNotifications.filter((item) => {
      const userName = item.user?.name || "";
      const userPhone = item.user?.phone || "";
      const userCode = item.user?.userCode || "";
      const projectTitle = item.project?.title || "";
      const message = item.message || "";

      const matchesFilter = activeFilter === "all" || item.type === activeFilter;
      const matchesDateRange = isWithinDateRange(item.createdAt, activeDateFilter);
      const matchesSearch =
        !query ||
        userName.toLowerCase().includes(query) ||
        userPhone.toLowerCase().includes(query) ||
        userCode.toLowerCase().includes(query) ||
        projectTitle.toLowerCase().includes(query) ||
        message.toLowerCase().includes(query);

      return matchesFilter && matchesDateRange && matchesSearch;
    });
  }, [activeDateFilter, activeFilter, searchValue, sortedNotifications]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredNotifications]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, activeDateFilter, searchValue]);

  const resolvedSummary = {
    total: summary?.total ?? notifications.length,
    unread: summary?.unread ?? 0,
    shortlists:
      summary?.shortlists ??
      notifications.filter(
        (item) =>
          item.type === "project_shortlisted" || item.type === "property_shortlisted",
      ).length,
    contacts:
      summary?.contacts ??
      notifications.filter((item) => item.type === "contact_requested").length,
    tickets:
      summary?.tickets ??
      notifications.filter((item) => item.type === "ticket_created").length,
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
      <div className={`mx-auto max-w-7xl space-y-6 ${containerClassName ?? ""}`.trim()}>
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
    <div className={`mx-auto min-w-0 max-w-7xl space-y-6 ${containerClassName ?? ""}`.trim()}>
      <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">{description}</p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#21884B]">
            <FiBell className="h-4 w-4" />
            <span>{resolvedSummary.total} notifications</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className={`${SUMMARY_CARD_LAYOUTS[0]} rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4 xl:col-span-1`}>
          <p className="text-xs font-medium leading-tight text-gray-500 sm:text-sm">All Notifications</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{resolvedSummary.total}</p>
        </div>
        <div className={`${SUMMARY_CARD_LAYOUTS[1]} rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4 xl:col-span-1`}>
          <p className="text-xs font-medium leading-tight text-gray-500 sm:text-sm">Shortlists</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{resolvedSummary.shortlists}</p>
        </div>
        <div className={`${SUMMARY_CARD_LAYOUTS[2]} rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4 xl:col-span-1`}>
          <p className="text-xs font-medium leading-tight text-gray-500 sm:text-sm">Contacts</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{resolvedSummary.contacts}</p>
        </div>
        <div className={`${SUMMARY_CARD_LAYOUTS[3]} rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4 xl:col-span-1`}>
          <p className="text-xs font-medium leading-tight text-gray-500 sm:text-sm">Tickets</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {resolvedSummary.tickets}
          </p>
        </div>
        <div className={`${SUMMARY_CARD_LAYOUTS[4]} rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4 xl:col-span-1`}>
          <p className="text-xs font-medium leading-tight text-gray-500 sm:text-sm">Brochure / Time</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {resolvedSummary.brochureDownloads + resolvedSummary.timeSpent}
          </p>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
                <div className="flex w-max min-w-full gap-2 sm:min-w-0 sm:flex-wrap">
                  {availableFilters.map((filter) => {
                    const isActive = activeFilter === filter.id;

                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
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
              </div>

              <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
                <div className="flex w-max min-w-full gap-2 sm:min-w-0 sm:flex-wrap">
                  {DATE_FILTERS.map((filter) => {
                    const isActive = activeDateFilter === filter.id;

                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveDateFilter(filter.id)}
                        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                          isActive
                            ? "border-[#26ad5f] bg-[#EAF6EE] text-[#21884B]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-[#BFE5CB] hover:bg-[#F6FBF8]"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:min-w-[22rem]">
              <div className="relative min-w-0 flex-1 xl:w-80">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search user, phone, code, property..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#26ad5f]"
                />
              </div>

              <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm text-gray-500 sm:justify-start">
                <FiFilter className="h-4 w-4" />
                <span>
                  {filteredNotifications.length} shown · Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 md:hidden">
          {paginatedNotifications.map((item, index) => (
            <article
              key={`${item.id}-${item.createdAt ?? "unknown"}-${index}`}
              className="space-y-4 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">
                    {item.user?.name || "You"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.user?.userCode || "No code"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-gray-700">{formatDate(item.createdAt)}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{formatTime(item.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getNotificationAccentClasses(
                    item.type,
                  )}`}
                >
                  {getNotificationLabel(item.type)}
                </span>
                <span className="rounded-full bg-[#F3FBF6] px-3 py-1 text-[11px] font-semibold text-[#21884B]">
                  {getRoleLabel(item.user?.role)}
                </span>
                {item.type === "high_time_spent" &&
                item.timeSpentMinutes &&
                item.timeSpentMinutes > 0 ? (
                  <span className="inline-flex rounded-full bg-[#F6FBF8] px-2.5 py-1 text-[11px] font-semibold text-[#21884B]">
                    {formatMinutes(item.timeSpentMinutes)}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Contact
                  </p>
                  <p className="text-sm text-gray-700">{item.user?.email || "No email"}</p>
                  <p className="text-sm text-gray-700">{item.user?.phone || "No phone"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Project
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {item.project?.title || "Untitled Project"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Message
                </p>
                <p className="text-sm leading-6 text-gray-800">
                  {item.message || "No message"}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden w-full overflow-x-auto md:block">
          <table className="w-full min-w-[900px] border-collapse text-left xl:min-w-full">
            <thead className="bg-[#F8FBF9]">
              <tr className="text-xs text-gray-500 lg:text-sm">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Contact Detail</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Message</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedNotifications.map((item, index) => (
                <tr
                  key={`${item.id}-${item.createdAt ?? "unknown"}-${index}`}
                  className="transition hover:bg-[#FCFDFD]"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <p>{formatDate(item.createdAt)}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{formatTime(item.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold leading-6 text-gray-900">
                        {item.user?.name || "You"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {item.user?.userCode || "No code"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-gray-500">
                        {item.user?.email || "No email"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {item.user?.phone || "No phone"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="rounded-full bg-[#F3FBF6] px-2.5 py-1 text-[11px] font-semibold text-[#21884B]">
                      {getRoleLabel(item.user?.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-medium leading-5 text-gray-900">
                      {item.project?.title || "Untitled Project"}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${getNotificationAccentClasses(
                            item.type,
                          )}`}
                        >
                          {getNotificationLabel(item.type)}
                        </span>
                        {item.type === "high_time_spent" &&
                        item.timeSpentMinutes &&
                        item.timeSpentMinutes > 0 ? (
                          <span className="inline-flex rounded-full bg-[#F6FBF8] px-2 py-1 text-[10px] font-semibold text-[#21884B]">
                            {formatMinutes(item.timeSpentMinutes)}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm leading-6 text-gray-800">
                        {item.message || "No message"}
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredNotifications.length)} of{" "}
              {filteredNotifications.length} notifications
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-[#F6FBF8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-10 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-[#26ad5f] text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-[#F6FBF8]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-[#F6FBF8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default NotificationFeed;
