"use client";

import { getHighlightProjects } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import { useCity } from "@/hooks/useCity";
import { useEffect, useRef, useState } from "react";
import {
    FiArrowLeft,
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
    const [showBanner, setShowBanner] = useState(true);
    const [selectedLocality, setSelectedLocality] = useState<string>("");
    const localitiesRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = localitiesRef.current;
        if (!el) return;

        const { scrollLeft, scrollWidth, clientWidth } = el;

        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };


    useEffect(() => {
        const el = localitiesRef.current;
        if (!el) return;

        checkScroll();

        el.addEventListener("scroll", checkScroll);
        window.addEventListener("resize", checkScroll);

        return () => {
            el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [selectedCity]);



    useEffect(() => {
        const timer = setTimeout(() => {
            setShowBanner(false);
        }, 15000); // 15 seconds

        return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
        if (!selectedCity) return;
        setLoading(true);

        const queryParams = selectedLocality
            ? { locality: selectedLocality }
            : {
                state: selectedCity.state,
                city: selectedCity.city,
            };

        getHighlightProjects(queryParams)
            .then((res) => {
                setItems(res?.items || []);
            })
            .catch((err) => console.error("Failed to fetch highlight projects:", err))
            .finally(() => setLoading(false));
    }, [selectedCity, selectedLocality]);

    useEffect(() => {
        setSelectedLocality("");
    }, [selectedCity?.city]);

    const formatPrice = (price?: number) => {
        if (!price || price <= 0) return "N/A";
        const cr = price / 1_00_00_000;
        return cr.toFixed(2);
    };

    const scrollLocalities = (direction: "left" | "right") => {
        if (!localitiesRef.current) return;
        const scrollAmount = 280;
        localitiesRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <>
            {/* Highlight Banner */}
            {showBanner && (
                <div className="w-full bg-[#4F8EF7] text-white text-sm">
                    <div className="container mx-auto px-4 py-3 flex items-start sm:items-center justify-between gap-3">

                        {/* Text */}
                        <div className="flex items-start sm:items-center gap-2 text-center sm:text-left flex-1">
                            <span className="text-lg shrink-0">🔥</span>
                            <p className="leading-snug">
                                Hand-picked for you – discover the most in-demand projects buyers
                                are choosing right now.
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setShowBanner(false)}
                            className="shrink-0 text-white/80 hover:text-white text-xl leading-none"
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>
                </div>
            )}


            <div className="container mx-auto px-4 py-8 space-y-6">
                {/* Header */}
                <div className="space-y-2 text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
                        Hotspots in{" "}
                        <span className="text-[#26ad5f]">
                            {selectedCity?.city || "Loading..."}
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
                        Popular localities with high demand and growth potential
                    </p>
                </div>

                {loading && (
                    <p className="text-sm text-slate-400">Loading highlights...</p>
                )}


                {/* Main content + sticky ad sidebar */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-10">
                    {/* Projects */}
                    <section className="space-y-6 flex-1 min-w-0">
                        {/* Localities */}
                        <div className="relative mb-3 sm:mb-5">
                            {canScrollLeft && (
                                <button
                                    type="button"
                                    onClick={() => scrollLocalities("left")}
                                    className="hidden md:block absolute left-0 lg:-left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow hover:bg-slate-50"
                                >
                                    <FiArrowLeft size={16} />
                                </button>
                            )}
                            <div
                                ref={localitiesRef}
                                className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-1 py-4 sm:py-5"
                            >
                                {selectedCity?.localities?.map((locality: any, index: number) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() =>
                                            setSelectedLocality((prev) =>
                                                prev === locality.name ? "" : locality.name
                                            )
                                        }
                                        className={`group min-w-[150px] sm:min-w-40 rounded-xl border bg-white p-3.5 sm:p-4 shadow-[10px_10px_10px_rgba(0,0,0,0.10)] transition cursor-pointer text-left ${selectedLocality === locality.name
                                            ? "border-emerald-500 ring-1 ring-emerald-200"
                                            : "border-slate-200 hover:border-emerald-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${selectedLocality === locality.name
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                                    }`}
                                            >
                                                <HiOutlineLocationMarker size={18} />
                                            </div>
                                            <h3 className="text-sm font-medium text-slate-900 truncate">
                                                {locality.name}
                                            </h3>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {canScrollRight && (
                                <button
                                    type="button"
                                    onClick={() => scrollLocalities("right")}
                                    className="hidden md:block absolute right-0 lg:-right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow hover:bg-slate-50"
                                >
                                    <FiArrowRight size={16} />
                                </button>
                            )}

                        </div>

                        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
                            {items.length > 0 && `${items.length}`} Projects in{" "}
                            {selectedLocality
                                ? `${selectedLocality}, ${selectedCity?.city || ""}`
                                : selectedCity?.city || "Loading..."}
                        </h2>

                        {loading ? (
                            <div className="h-40 flex items-center justify-center text-slate-400">
                                Loading featured projects...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                {items.map((project) => (
                                    <Link
                                        key={project._id}
                                        href={`/prime/${project.slug}`}
                                        className="block"
                                    >
                                        <div className="flex flex-col lg:flex-row card rounded-xl p-2 sm:p-3 gap-3 sm:gap-4">
                                            {/* Image */}
                                            <div className="relative w-full h-52 sm:h-56 lg:h-48 lg:w-[220px] xl:w-60 xl:h-[220px] shrink-0">
                                                <img
                                                    src={project.heroImage ?? "/images/placeholder.svg"}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="grow min-w-0 space-y-3 sm:space-y-4">
                                                <div>
                                                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 line-clamp-2">
                                                        {project.title}, {project.city}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {project.bhkSummary?.[0]?.name || "2, 3 BHK"} | Ready To
                                                        Move
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                                            <div className="w-full lg:w-[220px] lg:border-l border-slate-50 flex flex-col justify-center space-y-3 sm:space-y-4 bg-[#F1FCF5] p-4 rounded-xl items-stretch lg:items-center">
                                                <div className="text-lg sm:text-xl font-semibold text-[#26ad5f] text-left lg:text-center">
                                                    ₹ {formatPrice(project.priceFrom)} -{" "}
                                                    {formatPrice(project.priceTo)} Cr
                                                </div>
                                                <button className="w-full btn-primary text-white py-2 rounded-lg font-semibold text-sm sm:text-base">
                                                    Contact Owner
                                                </button>
                                                <button className="w-full border border-[#26ad5f] text-[#26ad5f] py-2 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-emerald-50">
                                                    <FiDownload /> Brochure
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                    {/* Ad banner */}
                    <aside className="w-full sm:max-w-md lg:max-w-none lg:w-[220px] lg:sticky lg:top-24 self-start shrink-0">
                        <Image
                            src={ad}
                            alt="advertisement banner"
                            className="w-full h-auto rounded-xl"
                        />
                    </aside>
                </div>
            </div>
        </>
    );
};

export default HotspotsPage;
