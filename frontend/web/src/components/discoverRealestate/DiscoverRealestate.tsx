"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCity } from "@/hooks/useCity";
import { ArrowDropdownIcon } from "@/icons/icons";
import {
    setCategory,
    setResidentialFilter,
    setSearchText,
} from "@/Redux/slice/filterSlice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
    HiArrowTrendingUp,
    HiBuildingOffice2,
    HiCurrencyRupee,
    HiMapPin,
} from "react-icons/hi2";

const benefits = [
    {
        title: "High Growth Potential",
        description: "Rapid infrastructure & IT development",
        icon: HiArrowTrendingUp,
    },
    {
        title: "Excellent Connectivity",
        description: "Well Connected roads,rail & airports",
        icon: HiBuildingOffice2,
    },
    {
        title: "Strong Rental Demand",
        description: "High rental yield in prime locations",
        icon: HiBuildingOffice2,
    },
    {
        title: "Investor Friendly",
        description: "Growing economy & business hubs",
        icon: HiCurrencyRupee,
    },
];

const DiscoverRealestate = () => {
    const tabScrollRef = useRef<HTMLDivElement | null>(null);
    const dispatch = useDispatch();
    const router = useRouter();
    const [showAllLocalities, setShowAllLocalities] = useState(false);
    const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
    const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);
    const { selectedCity, locations, selectCity } = useCity();
    const stateName = selectedCity?.state ?? "Telangana";
    const cityName = selectedCity?.city ?? "Hyderabad";
    const cityTabs = locations.filter((location) => location.state === stateName);
    const visibleCityTabs =
        cityTabs.length > 0
            ? cityTabs
            : selectedCity
                ? [selectedCity]
                : [];
    const localities = selectedCity?.localities?.length
        ? selectedCity.localities.map((locality) => ({
            name: locality.name,
        }))
        : Array.from({ length: 15 }, () => ({
            name: cityName === "Hyderabad" ? "Gachibowli" : cityName,
        }));
    const visibleLocalities = showAllLocalities
        ? localities
        : localities.slice(0, 15);
    const canViewMore = localities.length > 15;
    const scrollTabs = (direction: "left" | "right") => {
        tabScrollRef.current?.scrollBy({
            left: direction === "left" ? -180 : 180,
            behavior: "smooth",
        });
    };
    const handleLocalityClick = (localityName: string) => {
        dispatch(setCategory("Residential"));
        dispatch(setResidentialFilter({ key: "locality", value: [localityName] }));
        dispatch(setSearchText(""));
        router.push("/properties?focus=search");
    };

    useEffect(() => {
        const tabScroller = tabScrollRef.current;
        if (!tabScroller || visibleCityTabs.length === 0) {
            setCanScrollTabsLeft(false);
            setCanScrollTabsRight(false);
            return;
        }

        const updateTabArrows = () => {
            const maxScrollLeft = tabScroller.scrollWidth - tabScroller.clientWidth;

            setCanScrollTabsLeft(tabScroller.scrollLeft > 1);
            setCanScrollTabsRight(tabScroller.scrollLeft < maxScrollLeft - 1);
        };

        updateTabArrows();
        tabScroller.addEventListener("scroll", updateTabArrows);
        window.addEventListener("resize", updateTabArrows);

        return () => {
            tabScroller.removeEventListener("scroll", updateTabArrows);
            window.removeEventListener("resize", updateTabArrows);
        };
    }, [visibleCityTabs]);

    return (
        <section className="rounded-[22px] border border-[#dfe8e2] bg-white px-6 py-7 shadow-sm sm:px-7 lg:px-8 mb-10">
            <div className="flex items-center gap-4 border-b border-[#edf1ee] pb-4">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-[#d9f8e5] text-[#27ae60]">
                    <HiMapPin className="h-8 w-8" />
                </div>
                <h2 className="text-[24px] font-medium leading-tight text-[#111111]">
                    Discover more real estate Properties in {stateName}
                </h2>
            </div>

            <div className="grid gap-5 pt-5 lg:grid-cols-[264px_minmax(0,1fr)]">
                <aside className="rounded-xl bg-[#effcf4] px-5 py-4">
                    <h3 className="text-lg font-semibold text-[#18af5b]">
                        Why Invest in {stateName}?
                    </h3>

                    <div className="mt-6 space-y-7">
                        {benefits.map(({ title, description, icon: Icon }) => (
                            <div key={title} className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#85e0aa]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#202020]">
                                        {title}
                                    </p>
                                    <p className="mt-1 text-[9px] font-medium text-[#66736c] sm:text-[10px]">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <div className="min-w-0">
                    <div className="relative px-8">
                        {canScrollTabsLeft && (
                            <button
                                type="button"
                                aria-label="Scroll cities left"
                                onClick={() => scrollTabs("left")}
                                className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-2 shadow-md transition hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300 sm:inline-flex"
                            >
                                <ArrowDropdownIcon size={16} className="rotate-90" />
                            </button>
                        )}

                        <div
                            ref={tabScrollRef}
                            className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-1"
                        >
                            {visibleCityTabs.map((location) => (
                                <button
                                    key={location._id}
                                    type="button"
                                    onClick={() => {
                                        selectCity(location);
                                        setShowAllLocalities(false);
                                    }}
                                    className={`h-[37px] shrink-0 rounded-lg border px-5 text-base shadow-sm transition ${selectedCity?._id === location._id
                                            ? "border-[#27ae60] bg-[#27ae60] text-white"
                                            : "border-[#e0e0e0] bg-white text-[#a6a6a6]"
                                        }`}
                                >
                                    {location.city}
                                </button>
                            ))}
                        </div>

                        {canScrollTabsRight && (
                            <button
                                type="button"
                                aria-label="Scroll cities right"
                                onClick={() => scrollTabs("right")}
                                className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-2 shadow-md transition hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-300 sm:inline-flex"
                            >
                                <ArrowDropdownIcon size={16} className="rotate-270" />
                            </button>
                        )}
                    </div>

                    <h3 className="mt-6 text-xl font-medium text-[#171717]">
                        Popular Localities in {cityName}
                    </h3>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {visibleLocalities.map((locality, index) => (
                            <button
                                key={`${locality.name}-${index}`}
                                type="button"
                                onClick={() => handleLocalityClick(locality.name)}
                                className="flex min-h-[61px] items-center gap-2 rounded-lg border border-[#e8e8e8] bg-white px-3 text-left shadow-sm transition hover:border-[#27ae60]/50 hover:bg-[#fbfffc]"
                            >
                                <HiMapPin className="h-5 w-5 shrink-0 text-[#27ae60]" />
                                <span>
                                    <span className="block text-[15px] font-medium text-[#151515]">
                                        {locality.name}
                                    </span>
                                    <span className="mt-1 block text-[10px] font-medium text-[#7d8480]">
                                        View Properties
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>

                    {canViewMore && (
                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowAllLocalities((prev) => !prev)}
                                className="flex items-center gap-1 text-sm font-medium text-[#27ae60] hover:text-[#27ae60]/80"
                            >
                                {showAllLocalities ? "View Less" : "View More"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default DiscoverRealestate;
