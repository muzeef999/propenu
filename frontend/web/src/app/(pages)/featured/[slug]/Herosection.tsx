// components/HeroSection.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";


type Props = {
  hero?: Hero | null;
};

export type Stat = { value: string; label: string };

export type Hero = {
  subTagline?: string;
  description?: string;
  color?: string;      // either tailwind text class like 'text-yellow-400' or a hex '#ffa500'
  heroImage?: string;  // url/path to bg image
  highlight?: string;
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
  stats?: Stat[];
};


export default function HeroSection({ hero }: Props) {
  if (!hero) return null;



  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // replace with your real API call
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      console.error("submit error", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-label="Project hero"
      className="relative bg-cover bg-center"
      style={{ backgroundImage: `url(${hero?.heroImage})` }}
    >
      {/* gradient overlay */}
     <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-black/100" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* left content */}
          <div className="lg:col-span-7">
            <p className={`text-sm md:text-[64px] tracking-wider mb-2 text-[#FFF]`}>
              {hero.subTagline}
             </p>
             <p className={`text-sm md:text-[64px] tracking-wider mb-2 text-[${hero.color}]`}>
              {hero.description}
             </p>



            {hero?.description ? (
              <p className="mt-4 max-w-xl text-sm text-white/90">{hero?.description}</p>
            ) : null}

          </div>

          {/* right enquiry form */}
          <div className="lg:col-span-5">
            <div className="max-w-md ml-auto">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg">Enquiry Now</h3>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder="Your Name"
                    required
                  />

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder="Your Mobile Number"
                    required
                  />

                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder="Your Email"
                    required
                  />

                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder="Message"
                  />

         <button
  type="submit"
  aria-disabled={submitting}
  disabled={submitting}
  style={{ backgroundColor: hero.color }}
  className="w-full text-black font-bold py-2 rounded-md hover:brightness-95 transition"
>
  {submitting ? "Submitting..." : "Submit"}
</button>



                  {sent && <div className="text-xs text-green-300 mt-1">Thanks! Your enquiry was sent.</div>}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* spacing */}
      <div className="h-16 lg:h-28" />
    </section>
  );
}
