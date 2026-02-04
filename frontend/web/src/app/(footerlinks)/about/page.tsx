"use client";

import Logo from "@/animations/Logo";
import Link from "next/link";
import React from "react";

const About = () => {
  return (
    <div className="bg-linear-to-b from-white to-gray-50 min-h-screen">


      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-8 text-gray-700 leading-relaxed">
          <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                </div>
          {/* Intro */}
          <section className="space-y-4">
            

            <p>
              Propenu is a next-generation real estate technology platform that
              makes buying, selling, and managing properties easier through
              verified data, trusted services, and secure transactions.
            </p>

            <p>
              We connect property seekers with genuine owners, builders, and
              agents through a unified digital ecosystem that supports every
              stage of the property journey, from verification and discovery to
              home loan assistance and post-purchase services.
            </p>
          </section>

          {/* Trust Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Trust & Verification
            </h3>

            <p>
              Trust is at the core of Propenu. Every user and property listing on
              the platform goes through a structured KYC and verification
              process.
            </p>

            <p>
              This helps prevent fraudulent listings and helps ensures zero spam
              interactions, enabling users to make informed and confident
              property decisions.
            </p>
          </section>

          {/* Offerings */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              What We Offer
            </h3>

            <p>
              Propenu goes beyond traditional listing platforms by offering
              end-to-end support across the property journey, including:
            </p>

            <ul className="list-disc ml-2 space-y-2">
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">•</span><span>Verified and curated property listings</span></li>
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">•</span><span>Guided buying and enquiry support</span></li>
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">•</span><span>Lead management and analytics for real estate professionals</span></li>
              <li className="flex gap-2"><span className="text-[#D4AF37] font-bold">•</span><span>Access to home finance and post-purchase services</span></li>
            </ul>
          </section>

          {/* Vision */}
          <section className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Our Vision
            </h3>

            <p>
              Our aim is to create a trusted real estate ecosystem where verified
              users and properties, along with secure transactions, are the
              standard, not optional.
            </p>

            <p>
              Propenu enables users to engage with real estate confidently,
              knowing that every interaction on the platform is designed to be
              safe, purposeful, and valuable.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
