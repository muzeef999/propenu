"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
// Importing from react-icons
import { 
  BiErrorCircle, 
  BiBadgeCheck, 
  BiMoney, 
  BiSupport, 
  BiShieldQuarter, 
  BiGift, 
  BiTask 
} from "react-icons/bi";

/** -----------------------------
 * Types
 * ----------------------------- */
type Item = {
  color?: string;
  icon: React.ReactNode;
  link: string;
  title: string;
  desc: string;
};

/** -----------------------------
 * Data with React Icons
 * ----------------------------- */
const DEFAULT_DATA: Item[] = [
  {
    color: "#F59E0B", // Yellow/Orange
    icon: <BiErrorCircle className="w-full h-full" />,
    link: "#",
    title: "Zero Spam",
    desc: "Only genuine updates — no clutter, no noise.",
  },
  {
    color: "#22C55E", // Green
    icon: <BiBadgeCheck className="w-full h-full" />,
    link: "#",
    title: "Verified Properties",
    desc: "Every listing is thoroughly verified",
  },
  {
    color: "#3B82F6", // Blue
    icon: <BiMoney className="w-full h-full" />,
    link: "#",
    title: "Transparent Transaction",
    desc: "Clear, honest, and hassle-free processes",
  },
  {
    color: "#BE123C", // Red/Rose
    icon: <BiSupport className="w-full h-full" />,
    link: "#",
    title: "Expert Support",
    desc: "Estate experts whenever you need help.",
  },
  // Extra items to fill loop
  {
    color: "#A855F7", // Purple
    icon: <BiGift className="w-full h-full" />,
    link: "#",
    title: "Extra Benefit",
    desc: "Special offers & priority support.",
  },
  {
    color: "#F97316", // Orange
    icon: <BiShieldQuarter className="w-full h-full" />,
    link: "#",
    title: "Secure Documentation",
    desc: "Top-tier security for your data.",
  },
  {
    color: "#0E7490", // Cyan
    icon: <BiTask className="w-full h-full" />,
    link: "#",
    title: "End-to-End Assistance",
    desc: "From search to possession, we support.",
  },
];

const VISIBLE = 4;

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

    // Handle reduced motion
    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      wrap.style.height = "auto";
      return;
    }

    // Measure card height
    const firstCard = slider.querySelector<HTMLElement>("[data-card]");
    if (!firstCard) return;
    const cardRect = firstCard.getBoundingClientRect();
    
    // Calculate total height including margins
    const style = window.getComputedStyle(firstCard);
    const marginTop = parseFloat(style.marginTop);
    const marginBottom = parseFloat(style.marginBottom);
    const fullCardHeight = cardRect.height + marginTop + marginBottom;
    
    // Set container height based on visible items
    wrap.style.height = `${fullCardHeight * VISIBLE}px`;

    const totalScrollHeight = fullCardHeight * items.length;

    // Reset previous GSAP instance
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
      gsap.set(slider, { clearProps: "transform" });
    }

    // Create Animation
    const duration = items.length * 3.5; 
    
    const tl = gsap.timeline({ repeat: -1, paused: false });
    tl.to(slider, {
      y: -totalScrollHeight,
      ease: "none",
      duration: duration,
      modifiers: {
        y: (y) => {
            return `${parseFloat(y).toFixed(2)}px`; 
        },
      },
    });

    tlRef.current = tl;

    // Interaction handlers
    const onEnter = () => tl.pause();
    const onLeave = () => tl.play();
    
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);
    wrap.addEventListener("touchstart", onEnter);
    wrap.addEventListener("touchend", onLeave);

    return () => {
      tl.kill();
      tlRef.current = null;
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      wrap.removeEventListener("touchstart", onEnter);
      wrap.removeEventListener("touchend", onLeave);
      gsap.set(slider, { clearProps: "transform" });
    };
  }, [items]);

  return (
    <div className="w-[80%] p-2">
      <div
        ref={wrapRef}
        className="relative overflow-hidden py-4"
        aria-label="Features carousel"
      >
        <div ref={sliderRef} className="flex flex-col w-full will-change-transform">
          {doubled.map((item, idx) => {
            const hex = item.color ?? "#0ea5a4";
            
            // Alternating tilt: Even left, Odd right
            const rotateDeg = idx % 2 === 0 ? -2.5 : 2.5;
            const translateX = idx % 2 === 0 ? -5 : 5;

            const key = `${item.title.replace(/\s+/g, "-")}-${idx}`;

            return (
              <Link key={key} href={item.link} className="block group">
                <article
                  data-card
                  className="relative flex items-center gap-5 rounded-2xl p-3 mb-4 shadow-sm border border-slate-100 transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  style={{
                    transform: `rotate(${rotateDeg}deg) translateX(${translateX}px)`,
                    transformOrigin: "center center",
                  }}
                >
                  {/* Icon Container */}
                  <div 
                    style={{ color: hex }} 
                    className="shrink-0 w-7 h-7 flex items-center justify-center"
                  >
                    {item.icon}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h4
                      style={{ color: hex }}
                      className="text-[14px] font-semibold leading-tight mb-1"
                    >
                      {item.title}
                    </h4>
                    <p className="text-[13px] font-medium text-slate-500 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
        
        {/* Gradients */}
        <div className="absolute top-0 left-0 w-full h-8 bg-linear-to-b from-white to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 w-full h-8 bg-linear-to-t from-white to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}