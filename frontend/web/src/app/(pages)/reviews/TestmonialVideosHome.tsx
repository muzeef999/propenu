"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ServiceHomeLoan } from "@/icons/icons";

/** -----------------------------
 * Types
 * ----------------------------- */
type Item = {
  color?: string; // hex string like "#27AE60"
  icon: React.ReactNode;
  link: string;
  title: string;
  desc: string;
};

/** -----------------------------
 * Sample data (can be passed as props)
 * ----------------------------- */
const DEFAULT_DATA: Item[] = [
  {
    color: "#FFA406",
    icon: <ServiceHomeLoan />,
    link: "/blogs",
    title: "Zero Spam",
    desc: "Only genuine updates — no clutter, no noise.",
  },
  {
    color: "#27AE60",
    icon: <ServiceHomeLoan />,
    link: "/blogs",
    title: "Verified Properties",
    desc: "Every listing is thoroughly verified",
  },
  {
    color: "#15A2EE",
    icon: <ServiceHomeLoan />,
    link: "/blogs",
    title: "Transparent Transaction",
    desc: "Clear, honest, and hassle-free processes",
  },
  {
    color: "#9A3247",
    icon: <ServiceHomeLoan />,
    link: "/blogs",
    title: "Expert Support",
    desc: "Estate experts whenever you need help.",
  },
  {
    color: "#BC57F0",
    icon: <ServiceHomeLoan />,
    link: "/blogs",
    title: "Extra Benefit",
    desc: "Special offers & priority support.",
  },
  {
    color: "#EE6115",
    icon: <ServiceHomeLoan />,
    link: "/blogs",
    title: "Secure Documentation",
    desc: "top-tier security.",
  },
  {
    color: "#01828E",
    icon: <ServiceHomeLoan />,
    link: "/blogs",
    title: "End-to-End Assistance",
    desc: "From search to possession, we support.",
  },
];

/** -----------------------------
 * Visible count (how many are shown)
 * ----------------------------- */
const VISIBLE = 4;


/** -----------------------------
 * Component
 * ----------------------------- */
export default function TestimonialCardsMarquee({
  items = DEFAULT_DATA,
}: {
  items?: Item[];
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Seamless loop => duplicate items
  const doubled = [...items, ...items];

  useEffect(() => {
    const wrap = wrapRef.current;
    const slider = sliderRef.current;
    if (!wrap || !slider) return;
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      wrap.style.height = "auto";
      return;
    }

    const firstCard = slider.querySelector<HTMLElement>("[data-card]");
    if (!firstCard) return;
    const cardRect = firstCard.getBoundingClientRect();
    const marginBottom = parseFloat(
      getComputedStyle(firstCard).marginBottom || "0"
    );
    const cardHeight = Math.ceil(cardRect.height + marginBottom);
    const visibleCount = Math.min(VISIBLE, items.length);
    const totalScrollHeight = cardHeight * items.length;

    wrap.style.height = `${cardHeight * visibleCount}px`;

    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
      gsap.set(slider, { clearProps: "transform" });
    }

    const duration = Math.max(10, (totalScrollHeight / 100) * 1.5);
    const tl = gsap.timeline({ repeat: -1, paused: false });
    tl.to(slider, {
      y: -totalScrollHeight,
      ease: "none",
      duration,
      modifiers: {
        y: (y) => `${parseFloat(y).toFixed(2)}px`,
      },
    });

    tlRef.current = tl;

    const onEnter = () => tl.pause();
    const onLeave = () => tl.play();
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("focusin", onEnter);
    wrap.addEventListener("mouseleave", onLeave);
    wrap.addEventListener("focusout", onLeave);

    return () => {
      tl.kill();
      tlRef.current = null;
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("focusin", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      wrap.removeEventListener("focusout", onLeave);
      gsap.set(slider, { clearProps: "transform" });
    };
  }, [items]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        ref={wrapRef}
        className="relative overflow-hidden"
        aria-label="Benefits carousel"
      >
        <div ref={sliderRef} className="flex flex-col will-change-transform">
          {doubled.map((item, idx) => {
            const hex = item.color ?? "#0ea5a4";
            const textColor = hex; // icon/text color

            // subtle alternating tilt: -2, 1, -1, 2, ...
            const tiltAmt = ((idx % 5) - 2) * 1.2;

            // Slight stagger for overlap feel: odd indexes lift slightly
            const translateY = idx % 2 === 0 ? 0 : 2;

            const key = `${item.title
              .replace(/\s+/g, "-")
              .toLowerCase()}-${idx}`;

            return (
              <Link key={key} href={item.link} className="block">
                <article
                  data-card
                  className="relative flex items-center gap-4 rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow transform-gpu"
                  style={{
                    transform: `rotate(${tiltAmt}deg) translateY(${translateY}px)`,
                    transformOrigin: "left center",
                  }}
                >
                  {/* Icon badge */}
                     
                    <div style={{ color: textColor }} className="w-6 h-6">
                      {item.icon}
                    </div>
                  
                  {/* Text */}
                  <div className="min-w-0">
                    <h4
                      style={{ color: textColor }}
                      className="text-sm font-semibold  leading-tight"
                    >
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
