"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useState, useEffect, useMemo } from "react";
import ActiveTabs from "@/ui/ActiveTabs";
import {
  downloadLeadsCSV,
  getMyProperties,
  getProjectbuilderLeads,
  getProjectLeads,
  updateLeadStatus,
} from "@/data/ClientData";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const catregories = ["Featured"];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "approved",
  "rejected",
  "closed",
] as const;
const TAB_KEY_MAP: Record<string, string> = {
  Featured: "featured",
};

const formatPrice = (price?: number) => {
  if (!price) return "—";

  if (price >= 10000000) {
    return `₹ ${(price / 10000000).toFixed(2)} Cr`;
  }

  if (price >= 100000) {
    return `₹ ${(price / 100000).toFixed(2)} L`;
  }

  return `₹ ${price.toLocaleString("en-IN")}`;
};

const getPropertyPriceLabel = (property: any) => {
  const price = Number(property?.price);
  const priceFrom = Number(property?.priceFrom);
  const priceTo = Number(property?.priceTo);

  if (Number.isFinite(price) && price > 0) {
    return formatPrice(price);
  }

  if (
    Number.isFinite(priceFrom) &&
    priceFrom > 0 &&
    Number.isFinite(priceTo) &&
    priceTo > 0
  ) {
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

const BuilderLeadsPage = () => {
  const queryClient = useQueryClient();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState("Featured");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const [activeStatus, setActiveStatus] = useState("All");
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ["myProperties"],
    queryFn: getMyProperties,
  });
  const properties = useMemo(() => {
    if (!propertiesData) return [];
    return propertiesData[TAB_KEY_MAP[activeTab]] ?? [];
  }, [propertiesData, activeTab]);
  useEffect(() => {
    if (properties.length && !selectedPropertyId) {
      setSelectedPropertyId(properties[0]._id);
    }
  }, [properties, selectedPropertyId]);

  const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
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
    mutationFn: ({ id, status }: any) => {
      console.log("Updating lead:", id, status);
      return updateLeadStatus(id, status);
    },

    onSuccess: () => {
      console.log("Update success");
      queryClient.invalidateQueries({
        queryKey: ["projectLeadsbuilder", selectedPropertyId],
      });
    },
  });

  useEffect(() => {
    setActiveStatus("All");
  }, [selectedPropertyId]);


  const handleDownloadCSV = () => {
  if (!selectedPropertyId) {
    alert("Please select a property");
    return;
  }

  const from = fromDate
    ? fromDate.toISOString().split("T")[0]
    : undefined;

  const to = toDate
    ? toDate.toISOString().split("T")[0]
    : undefined;

  downloadLeadsCSV(selectedPropertyId, from, to);
};

  const filteredLeads = useMemo(() => {
    const leads = Array.isArray(leadsData?.data) ? leadsData.data : [];
    if (activeStatus === "All") {
      return leads;
    }
    return leads.filter(
      (lead: any) => lead.status?.toLowerCase() === activeStatus.toLowerCase(),
    );
  }, [leadsData, activeStatus]);

  if (propertiesLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading properties…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Leads</h1>
        <p className="text-gray-600">
          View enquiries received on your properties
        </p>
      </div>
      <div className="flex items-center justify-between">
        <ActiveTabs
          categories={catregories}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="flex gap-3 mb-4 items-center">
          <DatePicker
            selected={fromDate}
            onChange={(date: any) => setFromDate(date)}
            placeholderText="From Date"
            className="border px-2 py-1 rounded"
            dateFormat="yyyy-MM-dd"
          />

          <DatePicker
            selected={toDate}
            onChange={(date: any) => setToDate(date)}
            placeholderText="To Date"
            className="border px-2 py-1 rounded"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <button
  onClick={handleDownloadCSV}
  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
>
  Download CSV
</button>
        <span className="text-sm text-gray-600">
          Showing {properties.length} Properties
        </span>
      </div>
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT â€“ PROPERTY LIST */}
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

        {/* RIGHT â€“ LEADS */}
        <div className="col-span-8 bg-green-50/40 rounded-lg p-4">
          {/* STATUS TABS */}
          <div className="flex flex-wrap gap-2 mb-4">
            {LEAD_STATUSES.map((status) => {
              const active = activeStatus === status;

              return (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-3 py-1.5 rounded-md text-xs transition
          ${
            active
              ? "bg-green-100 text-gray-600 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }
        `}
                >
                  {status}
                </button>
              );
            })}
          </div>

          {/* TABLE */}
          {leadsLoading ? (
            <div className="text-center py-20 text-gray-500">
              Loading leadsâ€¦
            </div>
          ) : filteredLeads.length ? (
            <LeadsTable
              leads={filteredLeads}
              updateStatusMutation={updateStatusMutation}
            />
          ) : (
            <div className="text-center py-20 text-gray-500">
              No <b>{activeStatus}</b> leads for this property
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LeadsTable = ({ leads, updateStatusMutation }: any) => (
  <div className="bg-white rounded-lg overflow-hidden">
    <div className="grid grid-cols-4 px-4 py-3 text-xs font-semibold text-gray-500 border-b">
      <span>Name</span>
      <span>Date</span>
      <span>Contact Number</span>
      <span>Lead Status</span>
    </div>

    {leads.map((lead: any, idx: number) => (
      <div key={idx} className="grid grid-cols-4 px-4 py-3 text-sm border-b">
        <span>{lead.name}</span>
        <span className="text-gray-500">
          {new Date(lead.createdAt).toLocaleDateString("en-IN")}
        </span>
        <span>{lead.phone}</span>
        <select
          value={lead.status || "new"}
          onChange={(e) =>
            updateStatusMutation.mutate({
              id: lead._id,
              status: e.target.value,
            })
          }
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    ))}
  </div>
);

export default BuilderLeadsPage;
