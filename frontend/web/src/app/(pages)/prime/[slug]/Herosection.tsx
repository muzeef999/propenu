// components/HeroSection.tsx
"use client";

import { postLeads, projectpostLeads } from "@/data/ClientData";
import { Leads } from "@/types/property";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
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
  subTagline?: string;
  description?: string;
  color?: string;
  heroImage?: string;
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
}

export default function HeroSection({ hero }: Props) {
  if (!hero) return null;

  // Type guard: ensure hero is not undefined for the rest of the component
  const h = hero as Hero;

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

  leadsMutation.mutate({
    name: form.name,
    phone: form.phone,
    email: form.email,
    remarks: form.message,
    projectId: h.projectId,
  });
};


  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  


  return (
    <section
      aria-label="#hero-section"
      className="relative min-h-[75vh] md:min-h-[85vh] bg-cover bg-center"
      style={{ backgroundImage: `url(${h.heroImage})` }}
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

            <div className="absolute bottom-0 left-0 w-full lg:w-[65%] z-10">
              <div className=" py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {h.stats?.map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-white text-xl md:text-2xl font-bold">
                      {stat.value}
                    </div>

                    <div className="text-gray-200 text-sm mt-1">{stat.label}</div>

                    <div
                      className="w-12 h-0.5 mx-auto mt-2"
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
                  placeholder="Your Name"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Your Mobile Number"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                />

                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="Your Email"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                />

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Message"
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                />

                <button
                  type="submit"
                  disabled={leadsMutation.isPending}
                  style={{ backgroundColor: h.color }}
                  className="w-full text-white font-bold py-2 rounded-md hover:brightness-95 transition"
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
