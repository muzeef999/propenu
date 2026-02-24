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
import { FiFilter } from "react-icons/fi";
import { FaTimes, FaDownload, FaCcApplePay } from "react-icons/fa";
import { BiFilter } from "react-icons/bi";

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
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#F9FAFB] to-white border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BiFilter className="w-4 h-4 text-[#16A34A]" />
            <h2 className="text-sm font-semibold text-[#111827]">Filters</h2>
          </div>
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors"
          >
            <FaCcApplePay className="w-3 h-3" />
            Clear all
          </button>
        </div>

        {/* LEFT */}
        <div className="flex flex-wrap items-center gap-6 p-5">
          {/* DATE RANGE */}
          <div className="p-5">
            <label className="text-xs font-semibold text-gray-500 uppercase px-1">
              Date Range
            </label>

            <div className="flex gap-3 mt-1">
              <DatePicker
                selected={fromDate}
                onChange={(date: any) => setFromDate(date)}
                placeholderText="From Date"
                className="h-10 w-[170px] rounded-full border px-4 text-sm"
                dateFormat="yyyy-MM-dd"
              />

              <DatePicker
                selected={toDate}
                onChange={(date: any) => setToDate(date)}
                placeholderText="To Date"
                className="h-10 w-[170px] rounded-full border px-4 text-sm"
                dateFormat="yyyy-MM-dd"
              />
            </div>
          </div>

          {/* STATUS */}
          <div >
            <label className="text-xs font-semibold text-gray-500 uppercase px-1">
              Status
            </label>

            <div className="flex flex-wrap gap-2 mt-1">
              {["All", ...LEAD_STATUSES].map((status) => {
                const active = activeStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status as LeadStatus)}
                    className={`h-11 px-5 rounded-md text-sm capitalize transition
                      ${
                        active
                          ? "bg-green-600 text-white shadow"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {(fromDate || toDate || activeStatus !== "All") && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 mt-5"
            >
              <FaTimes /> Clear
            </button>
          )}
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between">
          <p className="text-xs text-[#6B7280]">
            Use filters to refine your property search
          </p>
          <button
            onClick={handleDownloadCSV}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white text-sm font-semibold shadow-[0_2px_8px_rgba(22,163,74,0.25)] hover:shadow-[0_4px_16px_rgba(22,163,74,0.4)] hover:from-[#15803D] hover:to-[#166534] active:scale-[0.97] transition-all duration-200 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_2px_8px_rgba(22,163,74,0.25)]"
          >
            <FaDownload className="w-4 h-4" />
            Export CSV
          </button>
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
        <div className="col-span-8 bg-green-50/40 rounded-lg p-4">
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
    <div className="bg-white rounded-lg overflow-hidden">
      {leads.map((lead) => (
        <div key={lead._id} className="grid grid-cols-4 p-3 border-b">
          <span>{lead.name}</span>
          <span>{new Date(lead.createdAt).toLocaleDateString("en-IN")}</span>
          <span>{lead.phone}</span>
          <select
            value={lead.status}
            onChange={(e) =>
              updateStatusMutation.mutate({
                id: lead._id,
                status: e.target.value,
              })
            }
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
