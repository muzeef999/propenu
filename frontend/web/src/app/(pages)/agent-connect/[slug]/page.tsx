"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IoMdShareAlt } from "react-icons/io";
import { AgentDetailsResponse } from "@/types";
import { getAgentDetails } from "@/data/serverData";
import { DetailRow, InfoRow, StatBox } from "@/ui/AgentPageComponents";
import ResidentialCard from "../../properties/cards/ResidentialCard";
import CommercialCard from "../../properties/cards/CommercialCard";
import { LandCard } from "../../properties/cards/LandCard";
import AgriculturalCard from "../../properties/cards/AgriculturalCard";

export default function Page() {
    const params = useParams<{ slug: string }>();
    const slug = params?.slug;
    const [data, setData] = useState<AgentDetailsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        async function loadAgent() {
            if (!slug) return;

            try {
                setIsLoading(true);
                setHasError(false);
                const response = await getAgentDetails({ slug });
                if (!isCancelled) setData(response);
            } catch {
                if (!isCancelled) setHasError(true);
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }

        loadAgent();

        return () => {
            isCancelled = true;
        };
    }, [slug]);

    async function shareAgent() {
        if (!data?.agent) return;

        const agentUrl = `${window.location.origin}/agent-connect/${data.agent.slug}`;
        const shareData = {
            title: data.agent.name || "Real estate agent",
            text: `Connect with ${data.agent.name || "this real estate agent"} on Propenu`,
            url: agentUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }

            await navigator.clipboard.writeText(agentUrl);
        } catch {
            // Share can be cancelled by the user; no UI needed.
        }
    }

    if (isLoading) {
        return (
            <main className="p-6">
                <h1 className="text-xl font-bold">Loading...</h1>
            </main>
        );
    }

    if (hasError) {
        return (
            <main className="p-6">
                <h1 className="text-xl font-bold">Something went wrong</h1>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="p-6">
                <h1 className="text-xl font-bold">Agent not found</h1>
            </main>
        );
    }

    const { agent, properties } = data;


    return (
        <div className="container mx-auto py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
                {/* ================= LEFT AGENT CARD ================= */}
                <aside className="lg:col-span-3 bg-white rounded-xl p-6 card">
                    <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28 rounded-full overflow-hidden ring-1 ring-emerald-100">
                            <Image
                                src={agent.avatar?.url || "/placeholder.jpg"}
                                alt={agent.name || "Agent Avatar"}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <h2 className="mt-4 text-xl font-semibold text-gray-800">
                            {agent.name}
                        </h2>

                        <div className="mt-5 w-full text-sm text-gray-600 space-y-2">
                            <InfoRow label="City:" value={agent.city} />
                            <InfoRow
                                label="Experience:"
                                value={`${agent.experienceYears}+ Years`}
                            />
                            <InfoRow label="Deals Closed:" value={`${agent.dealsClosed}+`} />
                            <InfoRow
                                label="Languages:"
                                value={agent.languages?.join(", ") || "Not specified"}
                            />
                            {agent.rera?.reraAgentId && (
                                <InfoRow label="RERA ID:" value={agent.rera.reraAgentId} />
                            )}
                        </div>

                        <button className="mt-6 w-full btn-primary py-2.5 rounded-md font-medium">
                            Contact Agent
                        </button>
                    </div>
                </aside>

                {/* ================= CENTER ABOUT CARD ================= */}
                <div className="lg:col-span-6 rounded-xl card p-6 flex flex-col">
                    {/* ================= HEADER ================= */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E31E24] text-white font-bold text-lg">
                                {agent.agencyName?.[0] || "F"}
                            </span>

                            <h3 className="font-bold text-xl text-gray-800 uppercase tracking-tight">
                                {agent.agencyName || "Flip Properties"}
                            </h3>
                        </div>

                        <button
                            type="button"
                            onClick={shareAgent}
                            className="p-2 border border-gray-100 rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            aria-label={`Share ${agent.name || "agent"}`}
                        >
                            <IoMdShareAlt size={20} />
                        </button>
                    </div>

                    {/* ================= BODY (FLEX-1) ================= */}
                    <div className="border-t border-gray-100 pt-6 flex-1">
                        {/* Biography */}
                        <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
                            {agent.bio || "N/A"}
                        </p>

                        {/* Details List */}
                        <div className="space-y-4 text-[15px]">
                            <DetailRow
                                label="Years in industry:"
                                value={`Serving the real estate market for ${agent.experienceYears || "N/A"
                                    }+ years.`}
                            />

                            <DetailRow
                                label="Coverage:"
                                value={agent.areasServed?.join(", ") || "N/A"}
                            />

                            <DetailRow
                                label="Address:"
                                value={`${agent.agencyName}, ${agent.city}`}
                            />
                        </div>
                    </div>

                    {/* ================= STATS (BOTTOM) ================= */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
                        <StatBox
                            label="Published Count"
                            value={agent.stats?.publishedCount ?? "—"}
                            bgColor="bg-cyan-50"
                            textColor="text-cyan-600"
                        />

                        <StatBox
                            label="Total Properties"
                            value={agent.stats?.totalProperties ?? "—"}
                            bgColor="bg-green-50"
                            textColor="text-green-600"
                        />

                        <StatBox
                            label="Deals Closed"
                            value={agent.dealsClosed ?? "—"}
                            bgColor="bg-yellow-50"
                            textColor="text-yellow-600"
                        />
                    </div>
                </div>
            </div>
            {/* ================= PROPERTIES LIST ================= */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
                {/* ===== PROPERTIES (75%) ===== */}
                <div className="lg:col-span-9 space-y-10">
                    {/* Residential */}
                    {properties.residential.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-xl p-6 filter-[drop-shadow(0_2px_6px_rgba(0,0,0,0.12))]">
                            <div className="headingSideBar">
                                <h1 className="text-xl font-bold">Properties in Residential</h1>{" "}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {properties.residential.map((property) => (
                                    <ResidentialCard key={property._id} p={property} vertical />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Commercial */}
                    {properties.commercial.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-xl p-6 filter-[drop-shadow(0_2px_6px_rgba(0,0,0,0.12))]">
                            <div className="headingSideBar">
                                <h1 className="text-xl font-bold">Properties in Commercial</h1>{" "}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-3 gap-4">
                                {properties.commercial.map((property) => (
                                    <CommercialCard key={property._id} p={property} vertical />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Plot */}
                    {properties.land.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-xl p-6 filter-[drop-shadow(0_2px_6px_rgba(0,0,0,0.12))]">
                            <div className="headingSideBar">
                                <h1 className="text-xl font-bold">Properties in Plot</h1>{" "}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {properties.land.map((property) => (
                                    <LandCard key={property._id} p={property} vertical />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Agricultural */}
                    {properties.agricultural.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-xl p-6 filter-[drop-shadow(0_2px_6px_rgba(0,0,0,0.12))]">
                            <div className="headingSideBar">
                                <h1 className="text-xl font-bold">Properties in Agricultural</h1>{" "}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {properties.agricultural.map((property) => (
                                    <AgriculturalCard key={property._id} p={property} vertical />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
