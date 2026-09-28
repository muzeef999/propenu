"use client";

import React from "react";
import Link from "next/link";
import BlogsClient from "@/app/(pages)/blogs/BlogsClient";

export default function HomeLoanArticles() {
  return (
    <section className="w-full bg-white py-12 sm:py-16">
      <div className="container mx-auto">
        <div className="mb-5 sm:mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
            Home Loan News &amp; Articles
          </h2>
          <Link
            href="/blogs"
            className="shrink-0 text-sm sm:text-base font-medium text-gray-900 transition-colors hover:text-[#27AE60]"
          >
            View More &gt;
          </Link>
        </div>
        <BlogsClient variant="home" showHeader={false} />
      </div>
    </section>
  );
}
