"use client";

import Image from "next/image";
import heroBannerMobile from "@/asserts/propenu-hero-banner-for-moblie.jpeg";
import heroBannerwebp from "@/asserts/propenu-hero-web-banner.jpeg";
import { useEffect, useMemo, useRef, useState } from "react";
import "./bannerStyle.css";
import SearchBox from "./SearchBox";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { useQuery } from "@tanstack/react-query";
import { getSiteBanners, SiteBannerItem, BannerDeviceConfig } from "@/data/ClientData";

const TEXTS = [
  " Verified properties.",
  " Verified users.",
  " Zero spam.",
  " Secure transactions.",
];

const Banner = () => {
  const [index, setIndex] = useState(0);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [previousBannerIdx, setPreviousBannerIdx] = useState<number | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = useRef(false);

  // Rotating trust tagline
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TEXTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Fetch site branding banners
  const { data: bannersData } = useQuery({
    queryKey: ["site-branding-banners"],
    queryFn: getSiteBanners,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const bannerList: SiteBannerItem[] = useMemo(() => {
    if (!bannersData?.data || !Array.isArray(bannersData.data) || bannersData.data.length === 0) {
      return [];
    }
    return [...bannersData.data].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }, [bannersData]);

  const currentBanner = bannerList[activeBannerIdx] || bannerList[0];
  const activeBannerKey = currentBanner?._id || `fallback-${activeBannerIdx}`;
  const previousBanner =
    previousBannerIdx !== null && previousBannerIdx < bannerList.length
      ? bannerList[previousBannerIdx]
      : null;

  const showBanner = (nextIndex: number) => {
    if (
      isTransitioningRef.current ||
      bannerList.length <= 1 ||
      nextIndex === activeBannerIdx
    ) {
      return;
    }

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    isTransitioningRef.current = true;
    setPreviousBannerIdx(activeBannerIdx);
    setActiveBannerIdx(nextIndex);
    transitionTimeoutRef.current = setTimeout(() => {
      setPreviousBannerIdx(null);
      isTransitioningRef.current = false;
    }, 700);
  };

  useEffect(() => {
    if (activeBannerIdx >= bannerList.length) {
      setActiveBannerIdx(0);
      setPreviousBannerIdx(null);
      isTransitioningRef.current = false;
    }
  }, [activeBannerIdx, bannerList.length]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      isTransitioningRef.current = false;
    };
  }, []);

  // Auto slide if multiple banners (4 sec interval)
  useEffect(() => {
    if (bannerList.length <= 1) return;
    const bannerInterval = setInterval(() => {
      showBanner((activeBannerIdx + 1) % bannerList.length);
    }, 4000);
    return () => clearInterval(bannerInterval);
  }, [activeBannerIdx, bannerList.length]);

  const hasDeviceContent = (config?: BannerDeviceConfig) => {
    const headingHtml = cleanRichTextHtml(config?.heading?.html);
    const subheadingHtml = cleanRichTextHtml(config?.subheading?.html);

    return Boolean(
      config?.image ||
        (config?.heading?.enabled && headingHtml.trim()) ||
        (config?.subheading?.enabled && subheadingHtml.trim()),
    );
  };

  const pickDeviceConfig = (
    ...configs: Array<BannerDeviceConfig | undefined>
  ): BannerDeviceConfig | undefined => {
    return configs.find(hasDeviceContent);
  };

  const getDeviceConfigs = (banner?: SiteBannerItem | null) => {
    const desktop = banner?.devices?.desktop;
    const laptop = banner?.devices?.laptop;
    const tablet = banner?.devices?.tablet;
    const mobile = banner?.devices?.mobile;

    const desktopConfig = pickDeviceConfig(desktop);
    const laptopConfig = pickDeviceConfig(laptop, desktop);
    const tabletConfig = pickDeviceConfig(tablet, laptop, desktop);
    const mobileConfig = pickDeviceConfig(mobile, tablet, laptop, desktop);

    return {
      desktopConfig,
      laptopConfig,
      tabletConfig,
      mobileConfig,
    };
  };

  const handleBannerClick = (clickUrl?: string) => {
    if (!clickUrl) return;
    if (clickUrl.startsWith("http://") || clickUrl.startsWith("https://")) {
      window.open(clickUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = clickUrl;
    }
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerList.length <= 1) return;
    showBanner((activeBannerIdx - 1 + bannerList.length) % bannerList.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerList.length <= 1) return;
    showBanner((activeBannerIdx + 1) % bannerList.length);
  };

  // Helper for cleaning rich text HTML attributes, unclosed font-family quotes, and inline styles
  const cleanRichTextHtml = (rawHtml?: string): string => {
    if (!rawHtml || typeof rawHtml !== "string") return "";

    let html = rawHtml;

    // 1. Unescape escaped quotes if any (e.g. \" -> ")
    html = html.replace(/\\"/g, '"');

    // 2. Parse and normalize each style="..." or style='...' attribute
    html = html.replace(/style\s*=\s*(["'])([\s\S]*?)\1/gi, (_, _quote, styleContent) => {
      // Decode HTML entities commonly found in rich text styles
      const cleaned = styleContent
        .replace(/&quot;?/gi, "'")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");

      // Split into individual CSS declarations
      const declarations = cleaned.split(";");
      const validDeclarations: string[] = [];

      for (const decl of declarations) {
        const trimmed = decl.trim();
        if (!trimmed) continue;

        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) continue;

        const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
        let val = trimmed.slice(colonIdx + 1).trim();

        if (!prop || !val) continue;

        // Handle font-family edge-cases (like font-family: ' or unclosed &quot)
        if (prop === "font-family") {
          const rawFontName = val.replace(/['"\\]/g, "").trim();
          // If font name is empty or invalid entity remnant, drop it
          if (!rawFontName || /^,+$/.test(rawFontName) || rawFontName.toLowerCase() === "quot") {
            continue;
          }
          val = rawFontName
            .split(",")
            .map((f: string) => {
              const font = f.trim();
              return font.includes(" ") ? `'${font}'` : font;
            })
            .join(", ");
        }

        validDeclarations.push(`${prop}: ${val}`);
      }

      if (validDeclarations.length === 0) {
        return "";
      }

      return `style="${validDeclarations.join("; ")}"`;
    });

    return html;
  };

  // Helper for rendering dynamic banner overlay text or default hero title
  const renderBannerContent = (deviceConfig?: BannerDeviceConfig, isMobile = false) => {
    const headingHtml = cleanRichTextHtml(deviceConfig?.heading?.html);
    const subheadingHtml = cleanRichTextHtml(deviceConfig?.subheading?.html);

    const hasDynamicHeading = deviceConfig?.heading?.enabled && Boolean(headingHtml.trim());
    const hasDynamicSubheading = deviceConfig?.subheading?.enabled && Boolean(subheadingHtml.trim());

    if (hasDynamicHeading || hasDynamicSubheading) {
      return (
        <div className="space-y-2">
          {hasDynamicHeading && (
            <div
              className="banner-dynamic-heading banner-rich-text"
              dangerouslySetInnerHTML={{ __html: headingHtml }}
            />
          )}
          {hasDynamicSubheading && (
            <div
              className="banner-dynamic-subheading banner-rich-text"
              dangerouslySetInnerHTML={{ __html: subheadingHtml }}
            />
          )}
        </div>
      );
    }

    // Default hero title & animated trust line
    // if (isMobile) {
    //   return (
    //     <div className="space-y-3">
    //       <h1 className="text-neutral-700 font-bold text-2xl leading-snug">
    //         Are you looking for a happy home? just like we did?
    //       </h1>
    //       <h3 className="text-neutral-600 font-normal text-lg">
    //         Tired of fake listings and spam calls?
    //       </h3>
    //       <div className="h-[4.8rem] flex flex-col justify-center overflow-hidden">
    //         <p className="text-xl">
    //           That's when we found <span className="highlight-name-logo">PROPENU</span>.
    //         </p>
    //         <div className="flex items-center gap-2 mt-1">
    //           <IoMdCheckmarkCircleOutline
    //             className="text-emerald-700 shrink-0 animate-fadeSlide tracking-wide"
    //             size={20}
    //           />
    //           <p
    //             key={index}
    //             className="text-emerald-700 font-semibold tracking-wide text-lg w-[230px] final-text-line animate-fadeSlide"
    //           >
    //             {TEXTS[index]}
    //           </p>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // }

    return (
      <div className="space-y-2.5 xl:space-y-3">
        {/* <h1 className="text-2xl font-bold leading-tight text-neutral-700 lg:text-3xl xl:text-4xl">
          Are you looking for a happy home, <br />
          just like we did?
        </h1>
        <h3 className="text-base font-normal text-neutral-600 lg:text-lg xl:text-xl">
          Tired of fake listings and spam calls?
        </h3>
        <div className="flex h-10 items-center gap-2 overflow-hidden xl:h-[3.2rem] xl:gap-3">
          <p className="whitespace-nowrap text-sm text-slate-600 lg:text-base xl:text-lg">
            Introducing <span className="highlight-name-logo">PROPENU</span>.
          </p>
          <IoMdCheckmarkCircleOutline
            className="text-emerald-700 shrink-0"
            size={20}
          />
          <p
            key={index}
            className="final-text-line w-[190px] font-semibold tracking-wide text-emerald-700 animate-fadeSlide xl:w-[230px]"
          >
            {TEXTS[index]}
          </p>
        </div> */}
      </div>
    );
  };

  const renderBannerLayer = (
    banner: SiteBannerItem | undefined | null,
    layerClassName: string,
    layerKey?: string,
  ) => {
    const { desktopConfig, laptopConfig, tabletConfig, mobileConfig } =
      getDeviceConfigs(banner);

    return (
      <div key={layerKey} className={layerClassName}>
        {/* ================= DESKTOP (>= 1280px) ================= */}
        <div className="hidden xl:block w-full relative banner-device-frame banner-device-desktop">
          {desktopConfig?.image ? (
            <img
              src={desktopConfig.image}
              alt={banner?.title || "Propenu desktop banner"}
              className={`w-full h-full object-cover ${desktopConfig.clickUrl ? "cursor-pointer" : ""
                }`}
              onClick={() => handleBannerClick(desktopConfig.clickUrl)}
            />
          ) : (
            <Image
              src={heroBannerwebp}
              alt="Propenu hero banner"
              priority
              sizes="100vw"
              className="h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 flex items-center pointer-events-none pb-12">
            <div className="w-full md:w-[66%] px-6 py-6 md:px-10 lg:px-14 xl:py-10 pointer-events-auto space-y-4">
              {renderBannerContent(desktopConfig, false)}
            </div>
          </div>
        </div>

        {/* ================= LAPTOP (1024px - 1279px) ================= */}
        <div className="hidden lg:block xl:hidden w-full relative banner-device-frame banner-device-laptop">
          {laptopConfig?.image ? (
            <img
              src={laptopConfig.image}
              alt={banner?.title || "Propenu laptop banner"}
              className={`w-full h-full object-cover ${laptopConfig.clickUrl ? "cursor-pointer" : ""
                }`}
              onClick={() => handleBannerClick(laptopConfig.clickUrl)}
            />
          ) : (
            <Image
              src={heroBannerwebp}
              alt="Propenu hero banner"
              priority
              sizes="100vw"
              className="h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 flex items-center pointer-events-none pb-12">
            <div className="w-full md:w-[70%] px-8 py-6 pointer-events-auto space-y-3">
              {renderBannerContent(laptopConfig, false)}
            </div>
          </div>
        </div>

        {/* ================= TABLET (768px - 1023px) ================= */}
        <div className="hidden md:block lg:hidden w-full relative banner-device-frame banner-device-tablet">
          {tabletConfig?.image ? (
            <img
              src={tabletConfig.image}
              alt={banner?.title || "Propenu tablet banner"}
              className={`w-full h-full object-cover ${tabletConfig.clickUrl ? "cursor-pointer" : ""
                }`}
              onClick={() => handleBannerClick(tabletConfig.clickUrl)}
            />
          ) : (
            <Image
              src={heroBannerwebp}
              alt="Propenu hero banner"
              priority
              sizes="100vw"
              className="h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 flex items-center pointer-events-none pb-12">
            <div className="w-full md:w-[80%] px-6 py-5 pointer-events-auto space-y-3">
              {renderBannerContent(tabletConfig, false)}
            </div>
          </div>
        </div>

        {/* ================= MOBILE (< 768px) ================= */}
        <div className="block md:hidden w-full relative banner-device-frame banner-device-mobile">
          {mobileConfig?.image ? (
            <img
              src={mobileConfig.image}
              alt={banner?.title || "Propenu mobile banner"}
              className={`w-full h-full object-cover ${mobileConfig.clickUrl ? "cursor-pointer" : ""
                }`}
              onClick={() => handleBannerClick(mobileConfig.clickUrl)}
            />
          ) : (
            <Image
              src={heroBannerMobile}
              alt="Propenu hero banner mobile"
              priority
              sizes="100vw"
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute inset-0 flex items-start pointer-events-none pb-8">
            <div className="w-full px-5 py-6 space-y-3 pointer-events-auto">
              {renderBannerContent(mobileConfig, true)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="relative w-full overflow-visible group mb-10 sm:mb-12 md:mb-16 select-none">
      <div className="banner-carousel-stage">
        {previousBanner &&
          renderBannerLayer(
            previousBanner,
            "banner-carousel-layer banner-carousel-layer-previous",
            `${previousBanner._id || previousBannerIdx}-previous`,
          )}
        {renderBannerLayer(
          currentBanner,
          `banner-carousel-layer-current ${previousBanner ? "banner-carousel-slide" : ""}`,
          `${activeBannerKey}-current`,
        )}
      </div>

      {/* ================= Left & Right Navigation Buttons with Fade-Out / In Effect ================= */}
      {bannerList.length > 1 && (
        <>
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevSlide}
            disabled={previousBanner !== null}
            aria-label="Previous banner slide"
            className="absolute left-3 md:left-6 top-[45%] -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-full bg-black/35 hover:bg-black/70 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 cursor-pointer shadow-lg hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:cursor-default disabled:hover:scale-100 disabled:active:scale-100"
          >
            <HiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNextSlide}
            disabled={previousBanner !== null}
            aria-label="Next banner slide"
            className="absolute right-3 md:right-6 top-[45%] -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-full bg-black/35 hover:bg-black/70 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 cursor-pointer shadow-lg hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:cursor-default disabled:hover:scale-100 disabled:active:scale-100"
          >
            <HiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* ================= Floating SearchBox (50% bottom overlap) ================= */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-20 px-4 sm:px-6 lg:px-8 flex justify-center pointer-events-auto">
        <div className="w-full max-w-3xl xl:max-w-4xl">
          <SearchBox hideOnMobile={false} className="max-w-none shadow-xl" />
        </div>
      </div>
    </section>
  );
};

export default Banner;
