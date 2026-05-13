"use client";

import { FeaturedProject } from "@/types";
import { getProjectConfigurationValue } from "@/utilies/projectConfiguration";
import { useEffect, useRef, useState } from "react";
import { FiCheckCircle, FiHeart, FiMapPin, FiShare2 } from "react-icons/fi";
import { HiChevronLeft, HiChevronRight, HiXMark } from "react-icons/hi2";

type HeroSectionProps = {
    project: FeaturedProject;
};

const tabs = [
    { label: "Overview", href: "#overview" },
    { label: "Photos & Videos", href: "#project-images" },
    { label: "Floor Plans", href: "#floor-plans" },
    { label: "Amenities", href: "#amenities" },
    { label: "Location", href: "#location" },
    { label: "Specifications", href: "#specifications" },
    { label: "About", href: "#about-project" },
];

function formatCompactPrice(price?: number) {
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
        return null;
    }

    if (price >= 1e7) {
        return `${(price / 1e7).toFixed(2).replace(/\.00$/, "")} Cr`;
    }

    if (price >= 1e5) {
        return `${(price / 1e5).toFixed(2).replace(/\.00$/, "")} L`;
    }

    return price.toLocaleString("en-IN");
}

function formatPriceRange(project: FeaturedProject) {
    const from = formatCompactPrice(project.priceFrom);
    const to = formatCompactPrice(project.priceTo);

    if (from && to && project.priceFrom !== project.priceTo) {
        return `Rs. ${from} - ${to}`;
    }

    if (from) return `Rs. ${from}`;
    if (to) return `Rs. ${to}`;
    return "Price on Request";
}

type GalleryImage = {
    url: string;
    title?: string;
    category?: string;
    order?: number;
};

function getGalleryImages(project: FeaturedProject): GalleryImage[] {
    const images = [
        ...(project.heroImage ? [{ url: project.heroImage, title: project.title, order: -1 }] : []),
        ...(project.gallerySummary ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    ].filter((item): item is GalleryImage => Boolean(item?.url));

    const seen = new Set<string>();
    return images.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });
}

export default function HeroSection({ project }: HeroSectionProps) {
    const locationText = [project.locality, project.city].filter(Boolean).join(", ");
    const galleryImages = getGalleryImages(project);
    const heroImage = galleryImages[0]?.url;
    const [isShortlisted, setIsShortlisted] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState(tabs[0].href);
    const navRef = useRef<HTMLDivElement | null>(null);
    const startX = useRef<number | null>(null);
    const originalBodyOverflowRef = useRef<string | null>(null);
    const activeImage = openIndex !== null ? galleryImages[openIndex] : null;

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(`shortlisted-project:${project._id}`);
            setIsShortlisted(saved === "true");
        } catch {
            setIsShortlisted(false);
        }
    }, [project._id]);

    useEffect(() => {
        if (openIndex !== null) {
            if (originalBodyOverflowRef.current === null) {
                originalBodyOverflowRef.current = document.body.style.overflow;
            }
            document.body.style.overflow = "hidden";
        } else if (originalBodyOverflowRef.current !== null) {
            document.body.style.overflow = originalBodyOverflowRef.current;
            originalBodyOverflowRef.current = null;
        }

        return () => {
            if (originalBodyOverflowRef.current !== null) {
                document.body.style.overflow = originalBodyOverflowRef.current;
                originalBodyOverflowRef.current = null;
            }
        };
    }, [openIndex]);

    useEffect(() => {
        function onKey(event: KeyboardEvent) {
            if (openIndex === null) return;
            if (event.key === "Escape") setOpenIndex(null);
            if (event.key === "ArrowLeft") prevPreview();
            if (event.key === "ArrowRight") nextPreview();
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    useEffect(() => {
        function updateActiveTab() {
            const scrollPosition = window.scrollY + 120;
            let currentTab = tabs[0].href;

            for (const tab of tabs) {
                const section = document.getElementById(tab.href.slice(1));
                if (section && section.offsetTop <= scrollPosition) {
                    currentTab = tab.href;
                }
            }

            setActiveTab(currentTab);
        }

        updateActiveTab();
        window.addEventListener("scroll", updateActiveTab, { passive: true });
        window.addEventListener("resize", updateActiveTab);

        return () => {
            window.removeEventListener("scroll", updateActiveTab);
            window.removeEventListener("resize", updateActiveTab);
        };
    }, []);

    useEffect(() => {
        const activeLink = navRef.current?.querySelector<HTMLAnchorElement>(`a[href="${activeTab}"]`);
        activeLink?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });
    }, [activeTab]);

    function toggleShortlist() {
        setIsShortlisted((current) => {
            const next = !current;
            try {
                window.localStorage.setItem(`shortlisted-project:${project._id}`, String(next));
            } catch {
                // Ignore storage failures; the button still reflects this session.
            }
            return next;
        });
    }

    async function shareProject() {
        const shareUrl = typeof window !== "undefined" ? window.location.href : "";
        const shareData = {
            title: project.title,
            text: `Check out ${project.title}`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            // User cancelled share or clipboard was unavailable.
        }
    }

    function prevPreview() {
        setOpenIndex((index) => (index === null ? null : (index - 1 + galleryImages.length) % galleryImages.length));
    }

    function nextPreview() {
        setOpenIndex((index) => (index === null ? null : (index + 1) % galleryImages.length));
    }

    function onTouchStart(event: React.TouchEvent) {
        startX.current = event.touches[0]?.clientX ?? null;
    }

    function onTouchEnd(event: React.TouchEvent) {
        if (startX.current === null || openIndex === null) return;

        const endX = event.changedTouches[0]?.clientX ?? 0;
        const delta = endX - startX.current;
        if (Math.abs(delta) > 50) {
            if (delta > 0) prevPreview();
            else nextPreview();
        }
        startX.current = null;
    }

    function openPreview(index = 0) {
        if (galleryImages.length > 0) {
            setOpenIndex(index);
        }
    }

    function onTabClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
        event.preventDefault();

        const section = document.getElementById(href.slice(1));
        if (!section) return;

        const top = section.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: "smooth" });
        window.history.pushState(null, "", href);
        setActiveTab(href);
    }

    return (
        <>
            <section className="bg-white">
                <div className="container mx-auto mt-5 px-1 sm:px-4 lg:px-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-semibold text-slate-950 sm:text-3xl">
                                {project.title}
                            </h1>

                            {locationText && (
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#6C6F79] sm:text-sm">
                                    <FiMapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{locationText}</span>
                                </p>
                            )}

                            {project.reraNumber && (
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                                    <FiCheckCircle className="h-3.5 w-3.5" />
                                    RERA ID : {project.reraNumber}
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 text-right">
                            {project.logo?.url && (
                                <img
                                    src={project.logo.url}
                                    alt={`${project.title} logo`}
                                    className="ml-auto h-12 max-w-40 object-contain sm:h-18 sm:max-w-48 border border-gray-200 rounded-md p-1"
                                />
                            )}
                            <p className="mt-2 text-sm font-bold text-[#4bbb7b] sm:text-base">
                                {formatPriceRange(project)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-xs leading-6 text-[#6C6F79] sm:text-sm">
                        <p>
                            {project.aboutSummary?.[0]?.aboutDescription || "No description available."}
                        </p>
                    </div>

                    <div className="relative mt-4 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                        {heroImage ? (
                            <button
                                type="button"
                                onClick={() => openPreview(0)}
                                className="block w-full cursor-pointer text-left"
                                aria-label="Open project image preview"
                            >
                                <img
                                    src={heroImage}
                                    alt={project.title}
                                    className="h-44 w-full object-cover sm:h-64 lg:h-100"
                                />
                            </button>
                        ) : (
                            <div className="flex h-44 w-full items-center justify-center bg-emerald-50 text-sm font-medium text-emerald-700 sm:h-64 lg:h-72">
                                Project image coming soon
                            </div>
                        )}

                        <div className="absolute right-3 top-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleShortlist}
                                className={`flex h-8 w-8 items-center justify-center rounded bg-white/90 shadow-sm backdrop-blur transition hover:bg-white ${
                                    isShortlisted ? "text-rose-500" : "text-slate-700"
                                }`}
                                aria-label="Shortlist project"
                                aria-pressed={isShortlisted}
                            >
                                <FiHeart className={`h-4 w-4 ${isShortlisted ? "fill-current" : ""}`} />
                            </button>
                            <button
                                type="button"
                                onClick={shareProject}
                                className="flex h-8 w-8 items-center justify-center rounded bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                                aria-label="Share project"
                            >
                                <FiShare2 className="h-4 w-4" />
                            </button>
                        </div>

                        {galleryImages.length > 0 && (
                            <button
                                type="button"
                                onClick={() => openPreview(0)}
                                className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                                aria-label={`Open all ${galleryImages.length} project images`}
                            >
                                {galleryImages.length}+
                            </button>
                        )}
                    </div>
                </div>

            </section>

            <div className="h-5 bg-white" />
            <nav className="sticky top-0 z-40 border-y border-slate-200 bg-white">
                <div
                    ref={navRef}
                    className="container mx-auto flex overflow-x-auto px-1 sm:px-4 lg:px-3"
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.href;

                        return (
                        <a
                            key={tab.href}
                            href={tab.href}
                            onClick={(event) => onTabClick(event, tab.href)}
                            className={`shrink-0 px-7 py-4 text-base font-semibold transition sm:text-lg ${
                                isActive
                                    ? "border-b-2 border-emerald-500 text-emerald-600"
                                    : "border-b-2 border-transparent text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            {tab.label}
                        </a>
                        );
                    })}
                </div>
            </nav>

            {openIndex !== null && activeImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm md:p-6"
                    onClick={() => setOpenIndex(null)}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <div
                        className="relative w-full max-w-6xl"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            type="button"
                            onClick={() => setOpenIndex(null)}
                            className="absolute right-0 top-0 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                            aria-label="Close gallery"
                        >
                            <HiXMark size={24} />
                        </button>

                        <div className="relative overflow-hidden rounded-2xl bg-black pt-12 shadow-2xl md:pt-0">
                            {galleryImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={prevPreview}
                                        className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 md:left-5"
                                        aria-label="Previous image"
                                    >
                                        <HiChevronLeft size={22} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={nextPreview}
                                        className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 md:right-5"
                                        aria-label="Next image"
                                    >
                                        <HiChevronRight size={22} />
                                    </button>
                                </>
                            )}

                            <img
                                src={activeImage.url}
                                alt={activeImage.title || `${project.title} image`}
                                className="max-h-[75vh] w-full object-contain"
                            />

                            {(activeImage.title || activeImage.category) && (
                                <div className="absolute bottom-0 w-full bg-linear-to-t from-black/80 to-transparent p-6 text-white">
                                    {activeImage.title && <div className="text-lg font-semibold">{activeImage.title}</div>}
                                    {activeImage.category && <div className="text-sm text-white/70">{activeImage.category}</div>}
                                </div>
                            )}
                        </div>

                        {galleryImages.length > 1 && (
                            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
                                {galleryImages.map((image, index) => (
                                    <button
                                        key={`${image.url}-hero-thumb-${index}`}
                                        type="button"
                                        onClick={() => setOpenIndex(index)}
                                        className={`shrink-0 overflow-hidden rounded-lg transition ${
                                            openIndex === index ? "scale-90 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                                        }`}
                                        style={{ width: 110 }}
                                        aria-label={`Open thumbnail ${index + 1}`}
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.title || `${project.title} thumbnail ${index + 1}`}
                                            className="h-16 w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
