"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import ActiveTabs from "@/ui/ActiveTabs";
import { getMyProperties, getProjectLeads } from "@/data/ClientData";

const categories = ["Residential", "Commercial", "Open Plot", "Agriculture Land"];

const LEAD_STATUSES = [
    "All",
    "New Lead",
    "Interested",
    "Not Interested",
    "Follow Up",
    "Site Visit",
    "Sale",
];

const normalizeLeadStatus = (status?: string) => {
    const normalized = status?.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const aliases: Record<string, string> = {
        new: "new_lead",
        intrested: "interested",
        not_intrested: "not_interested",
        contacted: "interested",
        approved: "interested",
        rejected: "not_interested",
        closed: "sale",
    };

    return normalized ? aliases[normalized] ?? normalized : "";
};

const formatLeadStatus = (status?: string) =>
    normalizeLeadStatus(status)
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const TAB_KEY_MAP: Record<string, string> = {
    Residential: "residential",
    Commercial: "commercial",
    Plot: "land",
    Agriculture: "agricultural",
};

const formatPrice = (price?: number) =>
    price ? `₹ ${(price / 10000000).toFixed(2)} Cr` : "—";

const LeadsPage = () => {
    const [activeTab, setActiveTab] = useState("Residential");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
        null,
    );
    const [activeStatus, setActiveStatus] = useState("All");

    /* ================= PROPERTIES ================= */
    const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
        queryKey: ["myProperties"],
        queryFn: getMyProperties,
    });

    const properties = useMemo(() => {
        if (!propertiesData) return [];

        const allProperties = propertiesData[TAB_KEY_MAP[activeTab]] ?? [];

        // ✅ Show only ACTIVE properties
        return allProperties.filter(
            (property: any) =>
                property.status?.toLowerCase() === "active"
        );
    }, [propertiesData, activeTab]);


    useEffect(() => {
        if (!properties.length) {
            if (selectedPropertyId) setSelectedPropertyId(null);
            return;
        }

        const isSelectedValid = properties.some(
            (property: any) => property._id === selectedPropertyId,
        );

        if (!isSelectedValid) {
            setSelectedPropertyId(properties[0]._id);
        }
    }, [properties, selectedPropertyId]);

    /* ================= LEADS ================= */
    const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
        queryKey: ["projectLeads", selectedPropertyId],
        queryFn: () => getProjectLeads(selectedPropertyId as string),
        enabled: !!selectedPropertyId,
    });

    useEffect(() => {
        setActiveStatus("All");
    }, [selectedPropertyId]);

    const filteredLeads = useMemo(() => {
        const leadsArray = Array.isArray(leadsData)
            ? leadsData
            : Array.isArray((leadsData as any)?.data)
                ? (leadsData as any).data
                : [];

        if (activeStatus === "All") {
            return leadsArray;
        }
        return leadsArray.filter(
            (lead: any) => normalizeLeadStatus(lead.status) === normalizeLeadStatus(activeStatus),
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
        <div className="space-y-5 sm:space-y-6">
            {/* HEADER */}
            <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
                <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                    My Leads
                </h1>
                <p className="mt-2 text-sm text-gray-600 md:text-base">
                    View enquiries received on your properties and keep track of
                    buyer activity in one place.
                </p>
            </div>

            {/* TABS */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <ActiveTabs
                    categories={categories}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
                <span className="text-sm text-gray-600">
                    Showing {properties.length} Properties
                </span>
            </div>

            {/* MAIN LAYOUT */}
            <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* LEFT – PROPERTY LIST */}
                <div className="lg:col-span-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {properties.map((property: any) => {
                        const image = property.gallery?.[0]?.url || "/placeholder.jpg";
                        const active = property._id === selectedPropertyId;

                        return (
                            <button
                                key={property._id}
                                onClick={() => setSelectedPropertyId(property._id)}
                                className={`w-full flex gap-3 rounded-lg border p-2 text-left transition
                  ${active
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                            >
                                <div className="w-20 h-16 rounded-md overflow-hidden bg-gray-100">
                                    <img
                                        src={image}
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
                                        {formatPrice(property.price)}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* RIGHT – LEADS */}
                <div className="lg:col-span-8 bg-green-50/60 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg sm:text-xl font-semibold text-green-700">Leads</h2>
                            <div className="h-1 w-10 rounded-full bg-green-500/70" />
                        </div>
                    </div>

                    {/* STATUS TABS */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {LEAD_STATUSES.map((status) => {
                            const active = activeStatus === status;

                            return (
                                <button
                                    key={status}
                                    onClick={() => setActiveStatus(status)}
                                    className={`px-3 py-1.5 rounded-md text-xs transition
          ${active
                                            ? "bg-green-100 text-gray-700 font-medium"
                                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
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
                            Loading leads…
                        </div>
                    ) : filteredLeads.length ? (
                        <LeadsTable leads={filteredLeads} />
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            No <b>{activeStatus}</b> leads for this property
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

/* ================= TABLE ================= */

const LeadsTable = ({ leads }: any) => {
    const getStatusStyle = (status: string) => {
        const normalized = normalizeLeadStatus(status);

        if (normalized === "new_lead")
            return "bg-blue-50 text-blue-600 border-blue-200";

        if (normalized === "interested")
            return "bg-yellow-50 text-yellow-600 border-yellow-200";

        if (normalized === "not_interested")
            return "bg-red-50 text-red-600 border-red-200";

        if (normalized === "follow_up")
            return "bg-purple-50 text-purple-600 border-purple-200";

        if (normalized === "site_visit")
            return "bg-indigo-50 text-indigo-600 border-indigo-200";

        if (normalized === "sale")
            return "bg-green-50 text-green-600 border-green-200";

        return "bg-gray-50 text-gray-600 border-gray-200";
    };

    return (
        <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {leads.map((lead: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-gray-800">{lead.name}</p>
                            <span
                                className={`px-2.5 py-1 text-xs rounded-full border font-medium ${getStatusStyle(
                                    lead.status
                                )}`}
                            >
                                {formatLeadStatus(lead.status)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                        </p>
                        <p className="text-sm text-gray-600">{lead.phone}</p>
                    </div>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-4 px-6 py-4 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                    <span>Name</span>
                    <span>Date</span>
                    <span>Contact Number</span>
                    <span>Status</span>
                </div>

                {leads.map((lead: any, idx: number) => (
                    <div
                        key={idx}
                        className="grid grid-cols-4 px-6 py-4 text-sm border-b last:border-b-0 hover:bg-gray-50 transition"
                    >
                        <div className="font-medium text-gray-800">
                            {lead.name}
                        </div>

                        <div className="text-gray-500">
                            {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                        </div>

                        <div className="text-gray-600">
                            {lead.phone}
                        </div>

                        <div>
                            <span
                                className={`px-2.5 py-1 text-xs rounded-full border font-medium ${getStatusStyle(
                                    lead.status
                                )}`}
                            >
                                {formatLeadStatus(lead.status)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};


export default LeadsPage;
