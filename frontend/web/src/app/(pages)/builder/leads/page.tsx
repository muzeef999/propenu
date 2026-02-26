"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useState, useEffect, useMemo, JSX } from "react";
import {
  downloadLeadsCSV,
  getMyProperties,
  getProjectbuilderLeads,
  updateLeadStatus,
} from "@/data/ClientData";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiChevronDown, FiDownloadCloud } from "react-icons/fi";

/* ================= TYPES ================= */

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "approved",
  "rejected",
  "closed",
] as const;

type LeadStatus = (typeof LEAD_STATUSES)[number] | "All";

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
  status: LeadStatus;
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
/* ================= PAGE ================= */

export default function BuilderLeadsPage(): JSX.Element {
  const queryClient = useQueryClient();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [activeTab] = useState("Featured");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [activeStatus, setActiveStatus] = useState<LeadStatus>("All");

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
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectLeadsbuilder", selectedPropertyId],
      });
    },
  });

  const filteredLeads = useMemo<Lead[]>(() => {
    const leads = leadsData?.data ?? [];
    if (activeStatus === "All") return leads;

    return leads.filter(
      (lead) => lead.status?.toLowerCase() === activeStatus.toLowerCase(),
    );
  }, [leadsData, activeStatus]);

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

  /* ================= UI ================= */

  if (propertiesLoading) {
    return <div className="text-center py-20">Loading properties…</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Leads</h1>
        <p className="text-gray-600">
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
                  {status.replace("_", " ")}
                </button>
              );
            })}
          </div>
          <span className="text-sm font-medium text-[#16A34A]">
            Showing {properties.length.toString().padStart(2, "0")} Properties
          </span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <DatePicker
                selected={fromDate}
                onChange={(date: any) => setFromDate(date)}
                placeholderText="From Date"
                className="h-9 w-[108px] rounded-md bg-[#E7E9E8] border border-[#DCE1DD] pl-3 pr-8 text-sm text-[#4B5563]"
                dateFormat="yyyy-MM-dd"
              />
              <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5563]" />
            </div>

            <div className="relative">
              <DatePicker
                selected={toDate}
                onChange={(date: any) => setToDate(date)}
                placeholderText="To Date"
                className="h-9 w-[108px] rounded-md bg-[#E7E9E8] border border-[#DCE1DD] pl-3 pr-8 text-sm text-[#4B5563]"
                dateFormat="yyyy-MM-dd"
              />
              <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B5563]" />
            </div>

            <button
              onClick={handleDownloadCSV}
              className="h-9 px-4 rounded-md bg-[#16A34A] text-white text-sm font-medium hover:bg-[#15803D] transition flex items-center gap-2"
            >
              Download
              <FiDownloadCloud className="w-4 h-4" />
            </button>

            {(fromDate || toDate || activeStatus !== "All") && (
              <button
                onClick={clearFilters}
                className="h-9 px-3 rounded-md text-sm text-[#4B5563] bg-[#E7E9E8] hover:bg-[#DDE1DE] transition"
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
      <div className="grid grid-cols-12 gap-4">
        {/* PROPERTY LIST */}
        <div className="col-span-4 space-y-2">
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
                    src={property.heroImage}
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
        <div className="col-span-8 bg-green-50/40 rounded-lg">
          {leadsLoading ? (
            <div className="text-center py-20">Loading leads…</div>
          ) : filteredLeads.length ? (
            <LeadsTable
              leads={filteredLeads}
              updateStatusMutation={updateStatusMutation}
            />
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

/* ================= TABLE ================= */

function LeadsTable({
  leads,
  updateStatusMutation,
}: {
  leads: Lead[];
  updateStatusMutation: any;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-4 px-6 py-4 text-xs font-semibold text-gray-500 bg-gray-50 border-b uppercase tracking-wide">
        <span>Name</span>
        <span>Date</span>
        <span>Contact Number</span>
        <span>Status</span>
      </div>

      {/* Rows */}
      {leads.map((lead) => (
        <div
          key={lead._id}
          className="grid grid-cols-4 items-center px-6 py-4 bg-[#E6E6E6] text-sm border-b last:border-b-0 hover:bg-gray-50 transition"
        >
          {/* Name */}
          <div className="font-medium text-gray-800 truncate">
            {lead.name}
          </div>

          {/* Date */}
          <div className="text-gray-500">
            {new Date(lead.createdAt).toLocaleDateString("en-IN")}
          </div>

          {/* Phone */}
          <div className="text-gray-600">
            {lead.phone}
          </div>

          {/* Status Dropdown Styled */}
          <div>
            <div className="relative inline-block w-full">
              <select
                className="w-full appearance-none px-3 py-1.5 pr-8 text-xs rounded-md border border-gray-300 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                value={lead.status}
                onChange={(e) =>
                  updateStatusMutation.mutate({
                    id: lead._id,
                    status: e.target.value,
                  })
                }
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>

              {/* Dropdown Arrow */}
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
