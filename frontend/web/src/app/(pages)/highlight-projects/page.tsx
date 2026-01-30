"use client";

import { getHighlightProjects } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import { useCity } from "@/hooks/useCity";
import { useEffect, useState } from "react";
import {
    FiArrowRight,
    FiChevronRight,
    FiDownload,
} from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import Image from "next/image";
import ad from "@/asserts/ad.png";
import Link from "next/link";

const HotspotsPage = () => {
    const { selectedCity } = useCity();

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<FeaturedProject[]>([]);

    useEffect(() => {
        if (!selectedCity) return;
        setLoading(true);

        getHighlightProjects({
            state: selectedCity.state,
            city: selectedCity.city,
        })
            .then((res) => {
                setItems(res?.items || []);
            })
            .catch((err) => console.error("❌ Error:", err))
            .finally(() => setLoading(false));
    }, [selectedCity]);

    const formatPrice = (price?: number) => {
        if (!price || price <= 0) return "N/A";
        const cr = price / 1_00_00_000;
        return cr.toFixed(2);
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                    Hotspots in{" "}
                    <span className="text-[#26ad5f]">
                        {selectedCity?.city || "Loading..."}
                    </span>
                </h1>
                <p className="text-sm text-slate-500">
                    Popular localities with high demand and growth potential
                </p>
            </div>

            {loading && (
                <p className="text-sm text-slate-400">Loading highlights...</p>
            )}

            {/* Localities */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {selectedCity?.localities?.map((locality: any, index: number) => (
                    <div
                        key={index}
                        className="group min-w-40 rounded-xl border border-slate-200 bg-white p-4 shadow-[10px_10px_10px_rgba(0,0,0,0.10)] transition cursor-pointer hover:border-emerald-300 mb-5"

                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                                <HiOutlineLocationMarker size={18} />
                            </div>
                            <h3 className="text-sm font-medium text-slate-900 truncate">
                                {locality.name}
                            </h3>
                        </div>

                    </div>
                ))}
            </div>

            {/* ✅ MAIN CONTENT + AD SIDEBAR FIX */}
            <div className="flex flex-col lg:flex-row gap-20">
                {/* Projects */}
                <section className="space-y-6 flex-1 max-w-4xl">
                    <h2 className="text-2xl font-semibold text-slate-900">
                        {items.length > 0 && `${items.length}`} Projects in{" "}
                        {selectedCity?.city || "Loading..."}
                    </h2>

                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-slate-400">
                            Loading featured projects...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {items.map((project) => (
                                <Link
                                    key={project._id}
                                    href={`/featured/${project.slug}`}
                                    className="block"
                                >
                                    <div
                                        key={project._id}
                                        className="flex flex-col lg:flex-row card rounded-xl p-2 gap-4"
                                    >
                                        {/* Image */}
                                        <div className="relative w-full lg:w-55 h-48 shrink-0">
                                            <img
                                                src={project.heroImage}
                                                alt={project.title}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="grow space-y-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-slate-900">
                                                    {project.title}, {project.city}
                                                </h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {project.bhkSummary?.[0]?.name || "2, 3 BHK"} | Ready To
                                                    Move
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-[#F1FCF5] p-4 rounded-xl space-y-2">
                                                    <p className="text-emerald-700 font-semibold text-sm">
                                                        Floor Plans
                                                    </p>
                                                    <p className="text-slate-600 text-sm">
                                                        {project.bhkSummary?.length || 0} unit configurations
                                                    </p>
                                                    <button className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:underline">
                                                        View Plans <FiChevronRight />
                                                    </button>
                                                </div>

                                                <div className="bg-[#F1FCF5] p-4 rounded-xl space-y-2">
                                                    <p className="text-emerald-700 font-semibold text-sm">
                                                        Amenities
                                                    </p>
                                                    <p className="text-slate-600 text-sm">
                                                        {project.amenities?.length || 0} amenities in the
                                                        project
                                                    </p>
                                                    <button className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:underline">
                                                        View All <FiChevronRight />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pricing */}
                                        <div className="w-full lg:w-50 border-l border-slate-50 flex flex-col justify-center space-y-4 bg-[#F1FCF5] p-4 rounded-xl items-center">
                                            <div className="text-xl font-semibold text-[#26ad5f]">
                                                ₹ {formatPrice(project.priceFrom)} -{" "}
                                                {formatPrice(project.priceTo)} Cr
                                            </div>
                                            <button className="w-full btn-primary text-white py-2 rounded-lg font-semibold">
                                                Contact Owner
                                            </button>
                                            <button className="w-full border border-[#26ad5f] text-[#26ad5f] py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-emerald-50">
                                                <FiDownload /> Brochure
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* ✅ AD BANNER (FIXED) */}
                <aside className="w-full lg:w-[200px] sticky top-10 self-start">
                    <Image
                        src={ad}
                        alt="advertisement banner"
                        className="w-full h-auto rounded-xl"
                    />
                </aside>
            </div>
        </div>
    );
};

export default HotspotsPage;
