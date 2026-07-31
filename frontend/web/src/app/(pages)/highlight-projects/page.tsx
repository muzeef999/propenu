"use client";

import { useQuery } from "@tanstack/react-query";
import { getHighlightProjects, getSponsored } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import { useCity } from "@/hooks/useCity";
import { minDelay } from "@/utilies/minDelay";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    FiArrowLeft,
    FiArrowRight,
    FiChevronRight,
    FiDownload,
    FiSearch,
    FiX,
} from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { IoMdShareAlt } from "react-icons/io";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import formatINR from "@/utilies/PriceFormat";
import AdCard, { type Ad } from "../properties/cards/AdCard";
import SponsoreCard from "../properties/cards/SponsoreCard";
import { useShortlist } from "@/hooks/useShortlist";
import { useAuth } from "@/hooks/useAuth";
import LoginDialog from "@/app/(auth)/Login";
import RegisterDialog from "@/app/(auth)/Register";
import { createPortal } from "react-dom";
import { toast } from "sonner";

type HighlightProjectsResponse = {
    items?: FeaturedProject[];
};

type SponsoredProperty = {
    id?: string;
    _id?: string;
    title?: string;
    slug?: string;
    type?: string;
    city?: string;
    buildingName?: string;
    heroImage?: string;
    gallery?: { url?: string }[];
    gallerySummary?: { url?: string }[];
    promotion?: { type?: string };
};

const skeletonItems = Array.from({ length: 3 });

const getPromotionLabel = (type?: string) => {
    if (type === "prime") return "Prime";
    if (type === "featured") return "Top Selling";
    if (type === "sponsored") return "Sponsored";
    return null;
};

const formatProjectCategoryLabel = (project: FeaturedProject) => {
    if (project.categoryType?.toLowerCase() === "land") {
        return project.propertyType || "Land";
    }

    return project.projectSummary?.[0]?.name || project.bhkSummary?.[0]?.name || "2, 3 BHK";
};

const formatProjectConfigurationCount = (project: FeaturedProject) => {
    if (project.categoryType?.toLowerCase() === "land") {
        return project.propertyType || "Land details available";
    }

    return `${project.projectSummary?.length || project.bhkSummary?.length || 0} unit configurations`;
};

const formatProjectPriceRange = (project: FeaturedProject) => {
    const from = project.priceFrom;
    const to = project.priceTo;

    if (from && to && from !== to) {
        return `${formatINR(from)} - ${formatINR(to)}`;
    }

    if (from) return `${formatINR(from)} onwards`;
    if (to) return formatINR(to);
    return "Price on Request";
};

const getProjectHref = (project: FeaturedProject) =>
    project.promotion?.type === "prime"
        ? `/prime/${project.slug}`
        : `/project/${project.slug}`;

const getSponsoredPropertyHref = (property: SponsoredProperty) => {
    const type = String(property.type || "").toLowerCase();
    const slug = property.slug || "";

    if (!slug) return "/";

    switch (type) {
        case "residential":
            return `/properties/residential/${slug}`;
        case "commercial":
            return `/properties/commercial/${slug}`;
        case "land":
            return `/properties/landploat/${slug}`;
        case "agricultural":
            return `/properties/agricultural/${slug}`;
        case "featuredproject":
            return property.promotion?.type === "prime"
                ? `/prime/${slug}`
                : `/project/${slug}`;
        default:
            return "/";
    }
};
const ProjectCardActions = ({
    project,
    projectHref,
}: {
    project: FeaturedProject;
    projectHref: string;
}) => {
    const { isShortlisted, isShortlistLoading, toggleShortlist } = useShortlist(
        project._id,
        "FeaturedProject",
    );

    const shareProject = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const shareUrl =
            typeof window !== "undefined"
                ? new URL(projectHref, window.location.origin).toString()
                : "";

        try {
            if (navigator.share) {
                await navigator.share({ title: project.title, url: shareUrl });
                return;
            }

            await navigator.clipboard.writeText(shareUrl);
            toast.success("Project link copied");
        } catch {
            // Ignore cancelled share or clipboard errors.
        }
    };

    return (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
            <button
                type="button"
                onClick={shareProject}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-all duration-200 hover:scale-110 active:scale-95"
                title="Share project"
                aria-label="Share project"
            >
                <IoMdShareAlt className="h-5 w-5 text-gray-700" />
            </button>

            <button
                type="button"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleShortlist();
                }}
                disabled={isShortlistLoading}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-all duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed"
                title={isShortlisted ? "Remove from shortlist" : "Shortlist"}
                aria-label={isShortlisted ? "Remove from shortlist" : "Shortlist"}
            >
                {isShortlistLoading ? (
                    <span className="block h-5 w-5 animate-pulse rounded-full bg-gray-300" />
                ) : isShortlisted ? (
                    <GoHeartFill className="h-5 w-5 text-red-500" />
                ) : (
                    <GoHeart className="h-5 w-5 text-gray-600 hover:text-red-500" />
                )}
            </button>
        </div>
    );
};

const HotspotsPage = () => {
    const { selectedCity } = useCity();
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [selectedLocality, setSelectedLocality] = useState<string>("");
    const [localitySearch, setLocalitySearch] = useState("");
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const localitiesRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set());



    useEffect(() => {
        setSelectedLocality("");
        setLocalitySearch("");
    }, [selectedCity?.city]);

    const filteredLocalities = useMemo(() => {
        const localities = Array.from(
            new Map(
                (selectedCity?.localities ?? [])
                    .map((locality: any) => locality?.name?.trim())
                    .filter((name): name is string => Boolean(name))
                    .map((name) => [name.toLowerCase(), { name }] as const),
            ).values(),
        );

        const query = localitySearch.trim().toLowerCase();
        if (!query) return localities;

        const startsWith = localities.filter((locality) =>
            locality.name.toLowerCase().startsWith(query),
        );
        const includes = localities.filter((locality) => {
            const name = locality.name.toLowerCase();
            return !name.startsWith(query) && name.includes(query);
        });

        return [...startsWith, ...includes];
    }, [selectedCity?.localities, localitySearch]);

    const { data, isLoading, isError } = useQuery<HighlightProjectsResponse>({
        queryKey: [
            "highlight-projects",
            selectedCity?.state,
            selectedCity?.city,
            selectedLocality,
        ],
        enabled: Boolean(selectedCity),
        queryFn: async () => {
            const queryParams = selectedLocality
                ? {
                    state: selectedCity?.state,
                    city: selectedCity?.city,
                    locality: selectedLocality,
                }
                : {
                    state: selectedCity?.state,
                    city: selectedCity?.city,
                };

            const [response] = await Promise.all([
                getHighlightProjects(queryParams),
                minDelay(1500),
            ]);

            return response;
        },
    });

    const items = data?.items || [];

    const searchedItems = useMemo(() => {
        const query = localitySearch.trim().toLowerCase();
        if (!query) return items;

        return items.filter((project) => {
            const searchableText = [
                project.title,
                project.city,
                project.state,
                project.locality,
                project.categoryType,
                project.propertyType,
                (project as any).buildingName,
                formatProjectCategoryLabel(project),
                formatProjectConfigurationCount(project),
                formatProjectPriceRange(project),
                project.projectSummary?.map((summary: any) => summary?.name).join(" "),
                project.bhkSummary?.map((summary: any) => summary?.name).join(" "),
                project.amenities?.map((amenity: any) => amenity?.name || amenity).join(" "),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [items, localitySearch]);

    const { data: sponsoredData, isLoading: isSponsoredLoading } = useQuery({
        queryKey: ["highlight-sponsored", selectedCity?.state, selectedCity?.city],
        enabled: Boolean(selectedCity),
        queryFn: () =>
            getSponsored({
                state: selectedCity?.state,
                city: selectedCity?.city,
            }),
    });

    const sidebarAds: Ad[] = (sponsoredData?.data || [])
        .slice(0, 2)
        .filter((property: SponsoredProperty) => !dismissedAds.has(property.id || property._id || ""))
        .map((property: SponsoredProperty) => ({
            id: property.id || property._id || "",
            title: property.title || "Sponsored Property",
            description: property.buildingName || property.city,
            imageUrl:
                property.heroImage ||
                property.gallery?.[0]?.url ||
                property.gallerySummary?.[0]?.url ||
                "/images/placeholder.svg",
            ctaText: "View Details",
            ctaLink: getSponsoredPropertyHref(property),
            category: property.type || "Featured",
            sponsored: true,
        }))
        .filter((ad: Ad) => Boolean(ad.id));

    const handleDismissAd = (adId: string) => {
        setDismissedAds((prev) => new Set([...prev, adId]));
    };

    useEffect(() => {
        const el = localitiesRef.current;
        if (isLoading || !el) {
            setCanScrollLeft(false);
            setCanScrollRight(false);
            return;
        }

        const checkScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = el;
            const maxScrollLeft = scrollWidth - clientWidth;
            const hasOverflow = maxScrollLeft > 1;

            setCanScrollLeft(hasOverflow && scrollLeft > 1);
            setCanScrollRight(hasOverflow && scrollLeft < maxScrollLeft - 1);
        };

        el.scrollLeft = 0;

        const frameId = window.requestAnimationFrame(checkScroll);
        const resizeObserver = new ResizeObserver(checkScroll);

        el.addEventListener("scroll", checkScroll);
        window.addEventListener("resize", checkScroll);
        resizeObserver.observe(el);

        return () => {
            window.cancelAnimationFrame(frameId);
            el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
            resizeObserver.disconnect();
        };
    }, [isLoading, selectedCity?.city, filteredLocalities.length]);

    const scrollLocalities = (direction: "left" | "right") => {
        if (!localitiesRef.current) return;
        const scrollAmount = 280;
        localitiesRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    const handleBrochureDownload = (url?: string) => {
        if (!url) return;

        if (!user) {
            setShowLoginDialog(true);
            return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <>
            <div className="container mx-auto px-4 py-8 space-y-6">
                {/* Header */}
                <div className="space-y-2 text-left md:text-left">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-slate-900">
                        Hotspots in{" "}
                        <span className="text-[#26ad5f] wrap-break-word">
                            {selectedCity?.city || "Loading..."}
                        </span>
                    </h1>

                    <p className="mx-auto md:mx-0 max-w-md lg:max-w-xl text-sm sm:text-base text-slate-500 leading-relaxed">
                        Popular localities with high demand and growth potential
                    </p>
                </div>

                {isError && (
                    <p className="text-sm text-red-500">
                        Failed to load highlight projects.
                    </p>
                )}


                {/* Main content + sticky ad sidebar */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-10">
                    {/* Projects */}
                    <section className="space-y-6 flex-1 min-w-0">
                        {isLoading ? (
                            <div className="space-y-6">
                                <div className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth px-1 py-4 sm:py-5 snap-x">
                                    {skeletonItems.map((_, index) => (
                                        <div
                                            key={`locality-skeleton-${index}`}
                                            className="snap-start shrink-0 min-w-[120px] sm:min-w-[140px] md:min-w-[150px] rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-[10px_10px_10px_rgba(0,0,0,0.10)]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                                                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-8 w-64 animate-pulse rounded bg-gray-200 sm:w-80" />

                                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                    {skeletonItems.map((_, index) => (
                                        <div
                                            key={`project-skeleton-${index}`}
                                            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-2 sm:p-3 lg:flex-row sm:gap-4"
                                        >
                                            <div className="h-52 w-full animate-pulse rounded-xl bg-slate-200 sm:h-56 lg:h-48 lg:w-[220px] xl:h-[220px] xl:w-60 shrink-0" />

                                            <div className="grow space-y-3 sm:space-y-4">
                                                <div className="space-y-2">
                                                    <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
                                                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                                                    <div className="space-y-2 rounded-xl bg-[#F1FCF5] p-4">
                                                        <div className="h-4 w-24 animate-pulse rounded bg-emerald-100" />
                                                        <div className="h-4 w-32 animate-pulse rounded bg-emerald-100" />
                                                        <div className="h-4 w-20 animate-pulse rounded bg-emerald-100" />
                                                    </div>
                                                    <div className="space-y-2 rounded-xl bg-[#F1FCF5] p-4">
                                                        <div className="h-4 w-24 animate-pulse rounded bg-emerald-100" />
                                                        <div className="h-4 w-32 animate-pulse rounded bg-emerald-100" />
                                                        <div className="h-4 w-20 animate-pulse rounded bg-emerald-100" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-3 rounded-xl bg-[#F1FCF5] p-4 lg:w-60 sm:space-y-4">
                                                <div className="h-7 w-36 animate-pulse rounded bg-emerald-100" />
                                                <div className="h-10 w-full animate-pulse rounded-lg bg-emerald-200" />
                                                <div className="h-10 w-full animate-pulse rounded-lg bg-emerald-100" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Localities */}
                                <div className="mb-3 space-y-3 sm:mb-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="relative w-full sm:max-w-sm">
                                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="search"
                                                value={localitySearch}
                                                onChange={(event) => {
                                                    setLocalitySearch(event.target.value);
                                                    setSelectedLocality("");
                                                }}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter" && filteredLocalities[0]) {
                                                        setSelectedLocality(filteredLocalities[0].name);
                                                    }
                                                }}
                                                placeholder="Search projects, localities, price"
                                                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                            />
                                            {localitySearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setLocalitySearch("")}
                                                    aria-label="Clear locality search"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {selectedLocality && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedLocality("")}
                                                className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                                            >
                                                Show all localities
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative">
                                        {canScrollLeft && (
                                            <button
                                                type="button"
                                                onClick={() => scrollLocalities("left")}
                                                aria-label="Scroll localities left"
                                                className="hidden md:block absolute left-2 md:-left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow hover:bg-slate-50"
                                            >
                                                <FiArrowLeft size={16} />
                                            </button>
                                        )}
                                        <div
                                            ref={localitiesRef}
                                            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth px-1 py-4 sm:py-5 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setSelectedLocality("")}
                                                aria-pressed={!selectedLocality}
                                                className={`group snap-start shrink-0 min-w-[120px] sm:min-w-[140px] md:min-w-[150px] lg:min-w-[180px] rounded-xl border bg-white p-3.5 sm:p-4 shadow-[10px_10px_10px_rgba(0,0,0,0.10)] transition cursor-pointer text-left ${!selectedLocality
                                                    ? "border-emerald-500 ring-1 ring-emerald-200"
                                                    : "border-slate-200 hover:border-emerald-300"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${!selectedLocality
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                                            }`}
                                                    >
                                                        <HiOutlineLocationMarker size={18} />
                                                    </div>
                                                    <h3 className="text-sm font-medium text-slate-900 truncate">
                                                        All
                                                    </h3>
                                                </div>
                                            </button>

                                            {filteredLocalities.map((locality, index: number) => (
                                                <button
                                                    key={`${locality.name}-${index}`}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedLocality((prev) =>
                                                            prev === locality.name ? "" : locality.name
                                                        )
                                                    }
                                                    aria-pressed={selectedLocality === locality.name}
                                                    className={`group snap-start shrink-0 min-w-[120px] sm:min-w-[140px] md:min-w-[150px] lg:min-w-[180px] rounded-xl border bg-white p-3.5 sm:p-4 shadow-[10px_10px_10px_rgba(0,0,0,0.10)] transition cursor-pointer text-left ${selectedLocality === locality.name
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

                                        {filteredLocalities.length === 0 && (
                                            <p className="px-1 pb-3 text-sm text-slate-500">
                                                No locality found for &quot;{localitySearch}&quot;.
                                            </p>
                                        )}

                                        {canScrollRight && (
                                            <button
                                                type="button"
                                                onClick={() => scrollLocalities("right")}
                                                aria-label="Scroll localities right"
                                                className="hidden md:block absolute right-2 md:-right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow hover:bg-slate-50"
                                            >
                                                <FiArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>

                                </div>
                                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
                                    {searchedItems.length} Projects in{" "}
                                    {selectedLocality
                                        ? `${selectedLocality}, ${selectedCity?.city || ""}`
                                        : selectedCity?.city || ""}
                                </h2>

                                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                    {searchedItems.length === 0 && (
                                        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                                            No projects found for &quot;{localitySearch}&quot;.
                                        </div>
                                    )}

                                    {searchedItems.map((project) => {
                                        const projectHref = getProjectHref(project);
                                        const promotionLabel = getPromotionLabel(
                                            project.promotion?.type
                                        );

                                        return (
                                            <Link
                                                key={project._id}
                                                href={projectHref}
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

                                                        <ProjectCardActions project={project} projectHref={projectHref} />

                                                        {promotionLabel && (
                                                            <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                                                                {promotionLabel}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="grow min-w-0 space-y-3 sm:space-y-4">
                                                        <div>
                                                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 line-clamp-2">
                                                                {project.title}, {project.city}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 mt-1">
                                                                {formatProjectCategoryLabel(project)} | Ready To Move
                                                            </p>
                                                        </div>

                                                        <div className="hidden sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
                                                            <div className="bg-[#F1FCF5] p-4 rounded-xl space-y-2">
                                                                <p className="text-emerald-700 font-semibold text-sm">
                                                                    Floor Plans
                                                                </p>
                                                                <p className="text-slate-600 text-sm">
                                                                    {formatProjectConfigurationCount(project)}
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.preventDefault();
                                                                        event.stopPropagation();
                                                                        router.push(`${projectHref}#floor-plans`);
                                                                    }}
                                                                    className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:underline"
                                                                >
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
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.preventDefault();
                                                                        event.stopPropagation();
                                                                        router.push(`${projectHref}#amenities`);
                                                                    }}
                                                                    className="flex items-center gap-1 text-emerald-600 text-sm font-semibold hover:underline"
                                                                >
                                                                    View All <FiChevronRight />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Pricing */}
                                                    <div className="w-full lg:w-60 lg:border-l border-slate-50 flex flex-col justify-center space-y-3 sm:space-y-4 bg-[#F1FCF5] p-4 rounded-xl items-stretch lg:items-center">
                                                        <div className="w-full text-center text-lg font-semibold leading-snug text-[#26ad5f] sm:text-xl">
                                                            {formatProjectPriceRange(project)}
                                                        </div>
                                                        <div
                                                            className="w-full"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                            }}
                                                        >
                                                            <ContactOwnerButton
                                                                projectId={project._id}
                                                                propertyType="featuredprojects"
                                                                listingType="sale"
                                                                listingSource="builder"
                                                                price={formatProjectPriceRange(project)}
                                                                propertyLabel={project.title}
                                                                className="mx-auto flex min-h-11 w-full min-w-[150px] items-center justify-center whitespace-nowrap rounded-lg btn-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                                                            >
                                                                Contact Owner
                                                            </ContactOwnerButton>
                                                        </div>
                                                        {project.brochure?.url ? (
                                                            <button
                                                                type="button"
                                                                disabled={isAuthLoading}
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    handleBrochureDownload(project.brochure?.url);
                                                                }}
                                                                className="w-full border border-[#26ad5f] text-[#26ad5f] py-2 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                                                            >
                                                                <FiDownload /> Brochure
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                disabled
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                }}
                                                                className="w-full border border-slate-200 text-slate-400 py-2 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 cursor-not-allowed"
                                                            >
                                                                <FiDownload /> Brochure
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>
                    <aside className="w-full lg:w-[20%]">
                        <div className="sticky top-24">
                            {(isLoading || isSponsoredLoading) ? (
                                <div className="h-80 w-full animate-pulse rounded-xl bg-slate-200" />
                            ) : (
                                <div className="space-y-4">
                                    {sidebarAds.map((ad) => (
                                        <AdCard key={ad.id} ad={ad} onDismiss={handleDismissAd} />
                                    ))}
                                    {sidebarAds.length === 0 && (
                                        <SponsoreCard />
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {showLoginDialog &&
                createPortal(
                    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
                        <LoginDialog
                            open
                            onClose={() => setShowLoginDialog(false)}
                            onSwitchToRegister={() => {
                                setShowLoginDialog(false);
                                setShowRegisterDialog(true);
                            }}
                        />
                    </div>,
                    document.body,
                )}

            {showRegisterDialog &&
                createPortal(
                    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
                        <RegisterDialog
                            open
                            onClose={() => setShowRegisterDialog(false)}
                            onSwitchToLogin={() => {
                                setShowRegisterDialog(false);
                                setShowLoginDialog(true);
                            }}
                        />
                    </div>,
                    document.body,
                )}
        </>
    );
};

export default HotspotsPage;
