"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useState, useEffect, useMemo, useRef, JSX, CSSProperties } from "react";
import {
  downloadLeadsCSV,
  getMyProperties,
  getProjectbuilderLeads,
  importProjectLeadsCSV,
  updateLeadStatus,
} from "@/data/ClientData";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiDownloadCloud,
  FiUploadCloud,
} from "react-icons/fi";

/* ================= TYPES ================= */

export const LEAD_STATUSES = [
  "new_lead",
  "interested",
  "not_interested",
  "follow_up",
  "site_visit",
  "sale",
] as const;

type LeadStatusValue = (typeof LEAD_STATUSES)[number];
type LeadStatus = LeadStatusValue | "All";
type StoredLeadStatus =
  | LeadStatusValue
  | "new"
  | "contacted"
  | "approved"
  | "rejected"
  | "closed";

interface Property {
  _id: string;
  title: string;
  city?: string;
  locality?: string;
  carpetArea?: number;
  heroImage?: string;
  price?: number;
  priceFrom?: number;
  priceTo?: number;
}

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  sourceCreatedAt?: string;
  purchaseTimeline?: string;
  budgetRange?: string;
  status: StoredLeadStatus;
  createdAt: string;
}

interface LeadsResponse {
  data: Lead[];
}

/* ================= UTILS ================= */

const TAB_KEY_MAP: Record<string, string> = {
  Featured: "featured",
};

const formatPrice = (price?: number) => {
  if (!price) return "—";
  if (price >= 10000000) return `₹ ${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹ ${(price / 100000).toFixed(2)} L`;
  return `₹ ${price.toLocaleString("en-IN")}`;
};


const getPropertyPriceLabel = (property: any) => {
  const price = Number(property?.price);
  const priceFrom = Number(property?.priceFrom);
  const priceTo = Number(property?.priceTo);

  if (Number.isFinite(price) && price > 0) {
    return formatPrice(price);
  }

  if (Number.isFinite(priceFrom) && priceFrom > 0 && Number.isFinite(priceTo) && priceTo > 0) {
    return `${formatPrice(priceFrom)} - ${formatPrice(priceTo)}`;
  }

  if (Number.isFinite(priceFrom) && priceFrom > 0) {
    return `From ${formatPrice(priceFrom)}`;
  }

  if (Number.isFinite(priceTo) && priceTo > 0) {
    return `Up to ${formatPrice(priceTo)}`;
  }

  return "—";
};

const getStatusClasses = (status: LeadStatusValue) => {
  switch (status) {
    case "new_lead":
      return "bg-blue-50 text-blue-700 ring-blue-100";
    case "interested":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "not_interested":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "follow_up":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "site_visit":
      return "bg-indigo-50 text-indigo-700 ring-indigo-100";
    case "sale":
      return "bg-green-50 text-green-700 ring-green-100";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-100";
  }
};

const getStatusDotClasses = (status: LeadStatusValue) => {
  switch (status) {
    case "new_lead":
      return "bg-blue-500";
    case "interested":
      return "bg-emerald-500";
    case "not_interested":
      return "bg-rose-500";
    case "follow_up":
      return "bg-amber-500";
    case "site_visit":
      return "bg-indigo-500";
    case "sale":
      return "bg-green-500";
    default:
      return "bg-gray-400";
  }
};

const normalizeLeadStatus = (status?: StoredLeadStatus): LeadStatusValue => {
  switch (status) {
    case "new":
      return "new_lead";
    case "contacted":
    case "approved":
      return "interested";
    case "rejected":
      return "not_interested";
    case "closed":
      return "sale";
    default:
      return (status ?? "new_lead") as LeadStatusValue;
  }
};

const formatStatus = (status: StoredLeadStatus) =>
  normalizeLeadStatus(status)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
const formatLeadDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN");
};

const getDisplayValue = (value?: string) => value?.trim() || "—";
const getLeadTimestamp = (lead: Lead) => {
  const value = lead.sourceCreatedAt || lead.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

const StatusSelect = ({
  lead,
  updateStatusMutation,
  className = "",
}: {
  lead: Lead;
  updateStatusMutation: any;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentStatus = normalizeLeadStatus(lead.status);
  const isUpdating = Boolean(updateStatusMutation?.isPending);

  const positionMenu = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 188);
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 12);

    setMenuStyle({
      left: Math.max(12, left),
      top: Math.min(rect.bottom + 8, window.innerHeight - 292),
      width: menuWidth,
    });
  };

  useEffect(() => {
    if (!open) return;

    positionMenu();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleReposition = () => positionMenu();

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const handleSelect = (status: LeadStatusValue) => {
    setOpen(false);

    if (status === currentStatus) return;

    updateStatusMutation.mutate({
      id: lead._id,
      status,
    });
  };

  return (
    <div className={`relative w-full min-w-[128px] max-w-[150px] ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={isUpdating}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border border-transparent px-3 text-left text-xs font-semibold leading-none ring-1 transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A] disabled:cursor-wait disabled:opacity-70 ${getStatusClasses(currentStatus)}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${getStatusDotClasses(currentStatus)}`}
          />
          <span className="truncate">{formatStatus(currentStatus)}</span>
        </span>
        <FiChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={menuStyle}
          className="fixed z-50 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-xl shadow-black/10"
          role="listbox"
          aria-label="Lead status"
        >
          {LEAD_STATUSES.map((status) => {
            const selected = status === currentStatus;

            return (
              <button
                key={status}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(status)}
                className={`flex h-9 w-full items-center justify-between gap-3 rounded-md px-2.5 text-left text-xs font-semibold transition ${
                  selected
                    ? "bg-[#F0FDF4] text-[#15803D]"
                    : "text-[#374151] hover:bg-[#F9FAFB]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${getStatusDotClasses(status)}`}
                  />
                  <span className="truncate">{formatStatus(status)}</span>
                </span>
                {selected && <FiCheck className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
/* ================= PAGE ================= */

export default function BuilderLeadsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [activeTab] = useState("Featured");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [activeStatus, setActiveStatus] = useState<LeadStatus>("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* -------- Properties -------- */
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery<
    Record<string, Property[]>
  >({
    queryKey: ["myProperties"],
    queryFn: getMyProperties,
  });

  const properties = useMemo<Property[]>(() => {
    if (!propertiesData) return [];
    return propertiesData[TAB_KEY_MAP[activeTab]] ?? [];
  }, [propertiesData, activeTab]);

  useEffect(() => {
    if (properties.length && !selectedPropertyId) {
      setSelectedPropertyId(properties[0]._id);
    }
  }, [properties, selectedPropertyId]);

  /* -------- Leads -------- */
  const { data: leadsData, isLoading: leadsLoading } = useQuery<LeadsResponse>({
    queryKey: ["projectLeadsbuilder", selectedPropertyId, fromDate, toDate],
    queryFn: () =>
      getProjectbuilderLeads(
        selectedPropertyId!,
        fromDate ?? undefined,
        toDate ?? undefined,
      ),
    enabled: !!selectedPropertyId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatusValue }) =>
      updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectLeadsbuilder", selectedPropertyId],
      });
    },
  });

  const importLeadsMutation = useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: File }) =>
      importProjectLeadsCSV(projectId, file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["projectLeadsbuilder", selectedPropertyId],
      });

      alert(
        `Imported ${result.imported ?? 0} leads. Skipped ${
          result.skipped ?? 0
        } rows.`
      );
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || error.message || "Import failed");
    },
  });

  const filteredLeads = useMemo<Lead[]>(() => {
    const leads = leadsData?.data ?? [];
    const matchingLeads =
      activeStatus === "All"
        ? leads
        : leads.filter((lead) => normalizeLeadStatus(lead.status) === activeStatus);

    return [...matchingLeads].sort(
      (a, b) => getLeadTimestamp(b) - getLeadTimestamp(a),
    );
  }, [leadsData, activeStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  const paginatedLeads = useMemo<Lead[]>(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedPropertyId, activeStatus, fromDate, toDate]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* -------- Actions -------- */

  const clearFilters = () => {
    setFromDate(null);
    setToDate(null);
    setActiveStatus("All");
  };

  const handleDownloadCSV = () => {
    if (!selectedPropertyId) return alert("Select property first");

    const from = fromDate?.toISOString().split("T")[0];
    const to = toDate?.toISOString().split("T")[0];

    downloadLeadsCSV(selectedPropertyId, from, to);
  };

  const handleImportClick = () => {
    if (!selectedPropertyId) return alert("Select property first");
    fileInputRef.current?.click();
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!selectedPropertyId) return alert("Select property first");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return alert("Please upload a CSV file");
    }

    importLeadsMutation.mutate({
      projectId: selectedPropertyId,
      file,
    });
  };

  /* ================= UI ================= */

  if (propertiesLoading) {
    return <div className="text-center py-20">Loading properties…</div>;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">My Leads</h1>
        <p className="text-sm sm:text-base text-gray-600">
          View enquiries received on your properties
        </p>
        <span className="text-sm text-gray-500">
          Showing <b>{properties.length}</b> Properties
        </span>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="rounded-lg bg-[#EEF2EF] border border-[#E3E7E4] p-4 md:p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {["All", ...LEAD_STATUSES].map((status) => {
              const active = activeStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status as LeadStatus)}
                  className={`h-8 px-3 rounded-md text-sm capitalize transition
                    ${
                      active
                        ? "bg-[#CFEFD9] text-[#14532D]"
                        : "bg-[#E7E9E8] text-[#4B5563] hover:bg-[#DDE1DE]"
                    }`}
                >
                  {status === "All" ? status : formatStatus(status as LeadStatusValue)}
                </button>
              );
            })}
          </div>
          <span className="text-sm font-medium text-[#16A34A]">
            Showing {properties.length.toString().padStart(2, "0")} Properties
          </span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <DatePicker
                selected={fromDate}
                onChange={(date: any) => setFromDate(date)}
                placeholderText="From Date"
                className="h-9 w-full sm:w-[108px] rounded-md bg-[#E7E9E8] border border-[#DCE1DD] pl-3 pr-8 text-sm text-[#4B5563]"
                dateFormat="yyyy-MM-dd"
              />
              <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5563]" />
            </div>

            <div className="relative w-full sm:w-auto">
              <DatePicker
                selected={toDate}
                onChange={(date: any) => setToDate(date)}
                placeholderText="To Date"
                className="h-9 w-full sm:w-[108px] rounded-md bg-[#E7E9E8] border border-[#DCE1DD] pl-3 pr-8 text-sm text-[#4B5563]"
                dateFormat="yyyy-MM-dd"
              />
              <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5563]" />
            </div>

            <button
              onClick={handleDownloadCSV}
              className="h-9 px-4 rounded-md bg-[#16A34A] text-white text-sm font-medium hover:bg-[#15803D] transition flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              Download
              <FiDownloadCloud className="w-4 h-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCSV}
            />

            <button
              onClick={handleImportClick}
              disabled={!selectedPropertyId || importLeadsMutation.isPending}
              className="h-9 px-4 rounded-md bg-white border border-[#16A34A] text-[#15803D] text-sm font-medium hover:bg-[#ECFDF3] disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100 transition flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {importLeadsMutation.isPending ? "Importing" : "Import"}
              <FiUploadCloud className="w-4 h-4" />
            </button>

            {(fromDate || toDate || activeStatus !== "All") && (
              <button
                onClick={clearFilters}
                className="h-9 px-3 rounded-md text-sm text-[#4B5563] bg-[#E7E9E8] hover:bg-[#DDE1DE] transition w-full sm:w-auto"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-sm text-[#6B7280]">
            {filteredLeads.length} Responses
          </span>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PROPERTY LIST */}
        <div className="lg:col-span-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {properties.map((property: any) => {
            const image = property.gallery?.[0]?.url || "/placeholder.jpg";
            const active = property._id === selectedPropertyId;

            return (
              <button
                key={property._id}
                onClick={() => setSelectedPropertyId(property._id)}
                className={`w-full flex gap-3 rounded-lg border p-2 text-left transition
                  ${
                    active
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
              >
                <div className="w-20 h-16 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={property.heroImage || image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate">
                    {property.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {property.locality}, {property.city}
                  </p>
                  <p className="text-xs text-gray-500">
                    Carpet Area: {property.carpetArea} sq.ft.
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    {getPropertyPriceLabel(property)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* LEADS TABLE */}
        <div className="lg:col-span-8 bg-green-50/40 rounded-lg p-2 sm:p-0">
          {leadsLoading ? (
            <div className="text-center py-20">Loading leads…</div>
          ) : filteredLeads.length ? (
            <div className="space-y-3">
              <LeadsTable
                leads={paginatedLeads}
                updateStatusMutation={updateStatusMutation}
              />
              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={filteredLeads.length}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              No leads found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const startItem = totalItems ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const visiblePages = pages.filter(
    (item) =>
      item === 1 ||
      item === totalPages ||
      Math.abs(item - page) <= 1
  );

  const pageItems = visiblePages.reduce<Array<number | "dots">>(
    (items, item) => {
      const previous = items[items.length - 1];
      if (typeof previous === "number" && item - previous > 1) {
        items.push("dots");
      }
      items.push(item);
      return items;
    },
    []
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-sm text-[#6B7280]">
        Showing{" "}
        <span className="font-semibold text-[#111827]">
          {startItem}-{endItem}
        </span>{" "}
        of <span className="font-semibold text-[#111827]">{totalItems}</span>{" "}
        responses
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#4B5563] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:text-[#D1D5DB]"
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {pageItems.map((item, index) =>
            item === "dots" ? (
              <span
                key={`dots-${index}`}
                className="flex h-9 w-7 items-center justify-center text-sm text-[#9CA3AF]"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                className={`h-9 min-w-9 rounded-md px-3 text-sm font-medium transition ${
                  page === item
                    ? "bg-[#16A34A] text-white shadow-sm"
                    : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#4B5563] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:text-[#D1D5DB]"
          aria-label="Next page"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ================= TABLE ================= */

function LeadsTable({
  leads,
  updateStatusMutation,
}: {
  leads: Lead[];
  updateStatusMutation: any;
}) {
  return (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => (
          <div
            key={lead._id}
            className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#F3F4F6] pb-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">
                  {lead.name}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">{lead.phone}</p>
                <p className="mt-1 truncate text-sm text-[#6B7280]">
                  {getDisplayValue(lead.email)}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs font-medium text-[#6B7280]">
                {formatLeadDate(lead.sourceCreatedAt || lead.createdAt)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#4B5563]">
              <p>
                <span className="font-medium text-[#111827]">Purchase: </span>
                {getDisplayValue(lead.purchaseTimeline)}
              </p>
              <p>
                <span className="font-medium text-[#111827]">Budget: </span>
                {getDisplayValue(lead.budgetRange)}
              </p>
            </div>
            <div className="mt-3">
              <StatusSelect
                lead={lead}
                updateStatusMutation={updateStatusMutation}
                className="max-w-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white shadow-sm md:block">
        <div className="grid min-w-[1080px] grid-cols-[minmax(150px,1.1fr)_minmax(130px,0.9fr)_minmax(180px,1.2fr)_minmax(120px,0.8fr)_minmax(170px,1fr)_minmax(140px,0.9fr)_150px] items-center border-b border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
          <span className="pl-1">Full Name</span>
          <span>Phone Number</span>
          <span>Email</span>
          <span>Lead Time</span>
          <span>Planning To Purchase</span>
          <span>Budget Range</span>
          <span>Status</span>
        </div>

        {leads.map((lead, index) => (
          <div
            key={lead._id}
            className={`grid min-w-[1080px] grid-cols-[minmax(150px,1.1fr)_minmax(130px,0.9fr)_minmax(180px,1.2fr)_minmax(120px,0.8fr)_minmax(170px,1fr)_minmax(140px,0.9fr)_150px] items-center border-b border-[#EEF2F0] px-5 py-3.5 text-sm transition last:border-b-0 hover:bg-[#F7FBF8] ${
              index % 2 === 0 ? "bg-white" : "bg-[#FCFDFD]"
            }`}
          >
            <div className="min-w-0 pr-4">
              <p className="truncate pl-1 font-semibold text-[#111827]">
                {lead.name}
              </p>
            </div>

            <div className="min-w-0 truncate pr-4 text-sm font-medium text-[#374151]">
              {lead.phone}
            </div>

            <div className="min-w-0 truncate pr-4 text-sm font-medium text-[#374151]">
              {getDisplayValue(lead.email)}
            </div>

            <div className="min-w-0 text-sm font-medium text-[#6B7280]">
              {formatLeadDate(lead.sourceCreatedAt || lead.createdAt)}
            </div>

            <div className="min-w-0 truncate pr-4 text-sm font-medium text-[#374151]">
              {getDisplayValue(lead.purchaseTimeline)}
            </div>

            <div className="min-w-0 truncate pr-4 text-sm font-medium text-[#374151]">
              {getDisplayValue(lead.budgetRange)}
            </div>

            <div className="min-w-0">
              <StatusSelect
                lead={lead}
                updateStatusMutation={updateStatusMutation}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
