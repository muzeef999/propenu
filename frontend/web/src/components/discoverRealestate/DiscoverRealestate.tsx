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
    const { selectedCity, locations } = useCity();
    const [showAllLocalities, setShowAllLocalities] = useState(false);
    const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
    const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);
    const [discoverCityId, setDiscoverCityId] = useState<string | null>(null);
    const discoverCity =
        locations.find((location) => location._id === discoverCityId) ??
        selectedCity;
    const stateName = discoverCity?.state ?? "Telangana";
    const cityName = discoverCity?.city ?? "Hyderabad";
    const cityTabs = locations.filter((location) => location.state === stateName);
    const visibleCityTabs =
        cityTabs.length > 0
            ? cityTabs
            : discoverCity
                ? [discoverCity]
                : [];
    const localities =
        discoverCity?.localities?.reduce<{ name: string }[]>((items, locality) => {
            const name = locality.name?.trim();
            const alreadyAdded = items.some(
                (item) => item.name.toLowerCase() === name?.toLowerCase(),
            );

            if (name && !alreadyAdded) {
                items.push({ name });
            }

            return items;
        }, []) ?? [];
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
        setDiscoverCityId(selectedCity?._id ?? null);
    }, [selectedCity?._id]);

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
        <section className="mb-10">
            <div className="flex items-center gap-4 border-b border-[#edf1ee] pb-3 sm:pb-4">
                <h2 className="text-[20px] font-medium leading-tight text-[#111111] sm:text-[24px]">
                    Discover more real estate Properties in {stateName}
                </h2>
            </div>

            <div className="grid gap-4 pt-4 sm:gap-5 sm:pt-5 lg:grid-cols-[264px_minmax(0,1fr)]">
                <aside className="rounded-xl bg-[#effcf4] px-4 py-4 sm:px-5">
                    <h3 className="text-base font-semibold text-[#18af5b] sm:text-lg">
                        Why Invest in {stateName}?
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:space-y-7 lg:block">
                        {benefits.map(({ title, description, icon: Icon }) => (
                            <div key={title} className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#85e0aa] sm:h-10 sm:w-10">
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#202020]">
                                        {title}
                                    </p>
                                    <p className="mt-1 text-[10px] font-medium leading-snug text-[#66736c]">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <div className="min-w-0">
                    <div className="relative -mx-1 px-1 sm:mx-0 sm:px-8">
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
                            className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth pb-1 sm:gap-4"
                        >
                            {visibleCityTabs.map((location) => (
                                <button
                                    key={location._id}
                                    type="button"
                                    onClick={() => {
                                        setDiscoverCityId(location._id);
                                        setShowAllLocalities(false);
                                    }}
                                    className={`h-9 shrink-0 rounded-lg border px-4 text-sm shadow-sm transition sm:h-[37px] sm:px-5 sm:text-base ${discoverCity?._id === location._id
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

                    <h3 className="mt-5 text-lg font-medium text-[#171717] sm:mt-6 sm:text-xl">
                        Popular Localities in {cityName}
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5">
                        {visibleLocalities.length > 0 ? (
                            visibleLocalities.map((locality) => (
                                <button
                                    key={locality.name}
                                    type="button"
                                    onClick={() => handleLocalityClick(locality.name)}
                                    className="flex min-h-[54px] items-center gap-2 rounded-lg border border-[#e8e8e8] bg-white px-3 text-left shadow-sm transition hover:border-[#27ae60]/50 hover:bg-[#fbfffc] sm:min-h-[61px]"
                                >
                                    <HiMapPin className="h-5 w-5 shrink-0 text-[#27ae60]" />
                                    <span className="min-w-0">
                                        <span className="block truncate text-[14px] font-medium text-[#151515] sm:text-[15px]">
                                            {locality.name}
                                        </span>
                                        <span className="mt-1 block text-[10px] font-medium text-[#7d8480]">
                                            View Properties
                                        </span>
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full rounded-lg border border-dashed border-[#d9e8df] bg-white px-4 py-5 text-sm font-medium text-[#66736c]">
                                Localities coming soon for {cityName}.
                            </div>
                        )}
                    </div>

                    {canViewMore && (
                        <div className="mt-4 flex justify-center sm:mt-5 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowAllLocalities((prev) => !prev)}
                                className="flex min-h-9 items-center gap-1 rounded-md px-3 text-sm font-medium text-[#27ae60] hover:text-[#27ae60]/80"
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
