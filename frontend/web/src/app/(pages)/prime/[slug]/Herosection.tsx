// components/HeroSection.tsx
"use client";

import { projectpostLeads } from "@/data/ClientData";
import { useShortlist } from "@/hooks/useShortlist";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { FiHeart } from "react-icons/fi";
import { IoIosShareAlt } from "react-icons/io";
import { toast } from "sonner";

type Props = {
  hero?: Hero;
};

export type Stat = {
  value: string;
  label: string;
};

export type Hero = {
  projectId: string;
  title?: string;
  subTagline?: string;
  description?: string;
  color?: string;
  heroImage?: string | { url?: string };
  stats?: Stat[];
  propertyType?: string;
  heroTagline?: string;
};


export interface ProjectLeadPayload {
  name: string;
  phone: string;
  email?: string;
  projectId?: string;
  remarks?: string;
  sourceCreatedAt?: string;
  purchaseTimeline?: string;
  budgetRange?: string;
  status?: string;
}

function isValidPhoneNumber(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  return /^\+?[1-9]\d{9,14}$/.test(normalized);
}

function sanitizePhoneInput(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    return cleaned.replace(/\+/g, "");
  }

  return `+${cleaned.slice(1).replace(/\+/g, "")}`;
}

function sanitizeNameInput(value: string) {
  return value.replace(/[^A-Za-z\s]/g, "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getFieldValidationMessage(
  field: HTMLInputElement | HTMLTextAreaElement,
) {
  const { name, validity } = field;

  if (validity.valueMissing) {
    if (name === "name") return "Please enter your name";
    if (name === "phone") return "Please enter your mobile number";
    if (name === "email") return "Please enter your email address";
    if (name === "message") return "Please enter your message";
  }

  if (validity.patternMismatch) {
    if (name === "name") return "Name should contain letters only";
    if (name === "phone") return "Please enter a valid phone number";
    if (name === "email") return "Please enter a valid email address";
  }

  if (validity.typeMismatch && name === "email") {
    return "Please enter a valid email address";
  }

  if (validity.tooShort && name === "message") {
    return "Message must be at least 10 characters";
  }

  return "Please check this field";
}

export default function HeroSection({ hero }: Props) {
  if (!hero) return null;

  // Type guard: ensure hero is not undefined for the rest of the component
  const h = hero as Hero;
  const heroImageUrl =
    typeof h.heroImage === "string" ? h.heroImage : h.heroImage?.url;
  const { isShortlisted, isShortlistLoading, toggleShortlist } = useShortlist(
    h.projectId,
    "FeaturedProject",
  );

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const leadsMutation = useMutation({
  mutationFn: projectpostLeads,

  onSuccess: () => {
    toast.success("Lead submitted successfully");

    setForm({
      name: "",
      phone: "",
      email: "",
      message: "",
    });
  },

  onError: () => {
    toast.error("Failed to submit lead");
  },
});

 
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!isValidPhoneNumber(form.phone)) {
    toast.error("Please enter a valid phone number");
    return;
  }

  if (!isValidEmail(form.email)) {
    toast.error("Please enter a valid email address");
    return;
  }

  leadsMutation.mutate({
    name: form.name,
    phone: form.phone,
    email: form.email.trim(),
    remarks: form.message,
    projectId: h.projectId,
  });
};


  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]:
        name === "phone"
          ? sanitizePhoneInput(value)
          : name === "name"
            ? sanitizeNameInput(value)
            : value,
    }));
  }

  function handleInvalid(
    e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    e.currentTarget.setCustomValidity(getFieldValidationMessage(e.currentTarget));
  }

  function handleFieldInput(
    e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    e.currentTarget.setCustomValidity("");
  }

  async function shareProject() {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: h.title || h.subTagline || "Prime Project",
      text: `Check out ${h.title || h.subTagline || "this prime project"}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success("Project link copied");
    } catch {
      // Ignore cancelled share / clipboard issues.
    }
  }



  return (
    <section
      aria-label="#hero-section"
      className="relative min-h-[75vh] md:min-h-[85vh] bg-slate-800 bg-cover bg-center"
      style={{
        backgroundImage: heroImageUrl ? `url("${heroImageUrl}")` : undefined,
      }}
    >
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/80" />
      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-48">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT TEXT */}
          <div className="lg:col-span-7 space-y-6">
            {h.heroTagline ? (
              <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-black/35 pr-4 pl-2 py-2 backdrop-blur-md border border-white/20">
                <span
                  className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px]"
                  style={{ backgroundColor: h.color || "#f59e0b", boxShadow: `0 0 12px ${h.color || "#f59e0b"}` }}
                />
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                  {h.heroTagline}
                </p>
              </div>
            ) : null}
            <h1 className="text-white text-2xl sm:text-3xl md:text-[64px] leading-tight">
              {h.subTagline}
            </h1>
            <h2
              className="lg:text-xl sm:text-3xl line-clamp-2 drop-shadow-lg"
              style={{
                color: h.color || "#fff",
                textShadow: "0 2px 10px rgba(0,0,0,0.8)"
              }}
            >
              {h.description}
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleShortlist}
                disabled={isShortlistLoading}
                className={`flex h-10 items-center gap-2 rounded-lg border border-white/70 bg-white/95 px-4 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white cursor-pointer ${
                  isShortlisted ? "text-rose-500" : "text-slate-700 hover:text-rose-500"
                } disabled:cursor-not-allowed disabled:opacity-70`}
                aria-label={isShortlisted ? "Remove project from shortlist" : "Shortlist project"}
                aria-pressed={isShortlisted}
              >
                <FiHeart className={`h-4 w-4 ${isShortlisted ? "fill-current" : ""}`} />
                <span>
                  {isShortlistLoading ? "Saving..." : isShortlisted ? "Shortlisted" : "Shortlist"}
                </span>
              </button>

              <button
                type="button"
                onClick={shareProject}
                className="flex h-10 items-center gap-2 rounded-lg border border-white/70 bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-emerald-600 cursor-pointer"
                aria-label="Share project"
              >
                <IoIosShareAlt className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>

            <div className="absolute bottom-0 left-0 w-full lg:w-[65%] z-10">
              <div className="grid grid-cols-2 gap-3 py-4 text-center sm:gap-4 sm:py-6 md:grid-cols-4 md:gap-6 lg:py-8">
                {h.stats?.map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-sm font-bold text-white sm:text-lg md:text-2xl">
                      {stat.value}
                    </div>

                    <div className="mt-0.5 text-[10px] text-gray-200 sm:mt-1 sm:text-xs md:text-sm">{stat.label}</div>

                    <div
                      className="mx-auto mt-1 h-0.5 w-8 sm:mt-2 sm:w-10 md:w-12"
                      style={{ backgroundColor: h.color }}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT FORM */}
          <div className="lg:col-span-5">
            <div className="w-full max-w-md lg:ml-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <h3 className="text-white font-semibold text-lg mb-4">
                Enquiry Now
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onInvalid={handleInvalid}
                  onInput={handleFieldInput}
                  inputMode="text"
                  pattern="[A-Za-z\s]+"
                  title="Name should contain letters only"
                  placeholder="Your Name"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                />

                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="^\+?[1-9]\d{9,14}$"
                  value={form.phone}
                  onChange={handleChange}
                  onInvalid={handleInvalid}
                  onInput={handleFieldInput}
                  title="Please enter a valid phone number"
                  placeholder="Your Mobile Number"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                />

                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onInvalid={handleInvalid}
                  onInput={handleFieldInput}
                  type="email"
                  autoComplete="email"
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Please enter a valid email address"
                  placeholder="Your Email"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                />

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  onInvalid={handleInvalid}
                  onInput={handleFieldInput}
                  rows={3}
                  minLength={10}
                  placeholder="Message"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                />

                <button
                  type="submit"
                  disabled={leadsMutation.isPending}
                  style={{ backgroundColor: h.color }}
                  className="w-full text-white font-bold py-2 rounded-md hover:brightness-95 transition cursor-pointer"
                >
                  {leadsMutation.isPending ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
