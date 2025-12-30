// components/HeroSection.tsx
"use client";

import React, { useState } from "react";

type Props = {
  hero?: Hero | null;
};

export type Stat = {
  value: string;
  label: string;
};

export type Hero = {
  subTagline?: string;
  description?: string;
  color?: string;
  heroImage?: string;
  stats?: Stat[];
};

export default function HeroSection({ hero }: Props) {
  if (!hero) return null;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSent(true);
    setForm({ name: "", phone: "", email: "", message: "" });
  }

  return (
    <section
      aria-label="Hero Section"
      className="relative min-h-[75vh] md:min-h-[85vh] bg-cover bg-center"
      style={{ backgroundImage: `url(${hero.heroImage})` }}
    >
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-linear-to-b from-white/0 to-black" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-48">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT TEXT */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-white text-2xl sm:text-3xl md:text-[64px] leading-tight">
              {hero.subTagline}
            </h1>
            <h2
              className="text-md sm:text-3xl  line-clamp-2 overflow-hidden"
              style={{ color: hero.color }}
            >
              {hero.description}
            </h2>
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
                  disabled={submitting}
                  style={{ backgroundColor: hero.color }}
                  className="w-full text-white font-bold py-2 rounded-md hover:brightness-95 transition"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>

                {sent && (
                  <p className="text-xs text-green-300">
                    Thanks! Your enquiry was sent.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATS BAR */}
      <div className="absolute bottom-0 left-0 w-full lg:w-[65%] z-10">
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {hero.stats?.map((stat, idx) => (
              <div key={idx}>
                <div className="text-white text-xl md:text-2xl font-bold">
                  {stat.value}
                </div>

                <div className="text-gray-200 text-sm mt-1">{stat.label}</div>

                <div
                  className="w-12 h-0.5 mx-auto mt-2"
                  style={{ backgroundColor: hero.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
