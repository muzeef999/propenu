"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IoLocationOutline } from "react-icons/io5";
import { GoHeartFill } from "react-icons/go";

import ActiveTabs from "@/ui/ActiveTabs";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import { getUserShortlist } from "@/data/ClientData";
import NopropertiesSvg from "@/svg/NopropertiesSvg";

/* ================= TYPES ================= */

interface PropertyDetails {
    _id: string;
    title?: string;
    address?: string;
    city?: string;
    price?: number;
    pricePerSqft?: number;
    slug?: string;
    gallery?: { url: string }[];
}

type PropertyType = "Residential" | "Commercial" | "Land" | "Agricultural";
type ContactPropertyType =
    | "residentials"
    | "commercials"
    | "landplots"
    | "agriculturals";

const PROPERTY_TYPE_MAP: Record<PropertyType, ContactPropertyType> = {
    Residential: "residentials",
    Commercial: "commercials",
    Land: "landplots",
    Agricultural: "agriculturals",
};

interface ShortlistedItem {
    _id: string;
    propertyType: PropertyType;
    property: PropertyDetails;
}

/* ================= COMPONENT ================= */

const Page = () => {
    const [activeTab, setActiveTab] = useState("Residential");

    const categories = [
        "Residential",
        "Commercial",
        "Open Plot",
        "Agriculture Land",
    ];

    const {
        data: shortlisted = [],
        isLoading,
        isError,
        error,
    } = useQuery<
        { data: ShortlistedItem[] },
        Error,
        ShortlistedItem[]
    >({
        queryKey: ["user-shortlist"],
        queryFn: getUserShortlist,
        select: (data) => data?.data ?? [],
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-gray-500">
                Loading shortlisted properties...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-64 items-center justify-center text-red-500">
                Error: {(error as Error).message}
            </div>
        );
    }

    const normalizeType = (type?: string) => {
        if (!type) return "";
        const t = type.toLowerCase();
        if (t === "land") return "plot";
        if (t === "agricultural") return "agriculture";
        return t;
    };

    const filteredProperties = shortlisted.filter(
        (item) => normalizeType(item.propertyType) === activeTab.toLowerCase()
    );

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
                <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                    Shortlisted Properties
                </h1>
                <p className="mt-2 text-sm text-gray-600 md:text-base">
                    Explore the properties you have shortlisted and revisit the ones you
                    liked most.
                </p>
            </div>

            <ActiveTabs
                categories={categories}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.length ? (
                    filteredProperties.map((item) => {
                        const image = item.property?.gallery?.[0]?.url;

                        return (
                            <Link
                                key={item._id}
                                href={`/properties/${item.propertyType?.toLowerCase()}/${item.property?.slug}`}
                                className="card flex flex-col overflow-hidden rounded-xl bg-white"
                            >
                                <div className="relative h-44">
                                    <img
                                        src={image}
                                        alt={item.property?.title || "Property"}
                                        className="h-full w-full object-cover"
                                    />

                                    <div className="absolute right-3 top-3 rounded-full bg-white p-2 shadow">
                                        <GoHeartFill className="h-5 w-5 text-red-500" />
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col space-y-3 p-4">
                                    <h3 className="line-clamp-1 text-base font-semibold text-gray-800">
                                        {item.property?.title || "Untitled Property"}
                                    </h3>

                                    <div className="flex items-center gap-1 truncate text-sm text-gray-500">
                                        <IoLocationOutline className="h-4 w-4 text-green-500" />
                                        {item.property?.address || "Location not specified"}
                                    </div>
                                </div>

                                <aside className="mx-1.5 mb-1.5 mt-auto flex items-center justify-between rounded-xl bg-[#E9F7EF] p-2">
                                    <div className="flex flex-col pl-2 leading-tight">
                                        <span className="text-md font-semibold text-[#21884B]">
                                            {item.property?.price
                                                ? `₹ ${item.property.price.toLocaleString("en-IN")}`
                                                : "—"}
                                        </span>

                                    </div>

                                    <div
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        <ContactOwnerButton
                                            projectId={item.property?._id}
                                            propertyType={PROPERTY_TYPE_MAP[item.propertyType]}
                                            price={item.property?.price}
                                            propertyLabel={item.property?.title}
                                            className="rounded-md bg-[#26ad5f] px-4 py-2 text-sm font-medium text-white"
                                        >
                                            Contact Owner
                                        </ContactOwnerButton>
                                    </div>
                                </aside>
                            </Link>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                            <NopropertiesSvg />
                        </div>
                        No properties found in "{activeTab}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default Page;
