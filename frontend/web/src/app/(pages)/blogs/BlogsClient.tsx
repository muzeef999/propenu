"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowRight, FiClock } from "react-icons/fi";
import { getBlogs } from "@/data/ClientData";
import { useCity } from "@/hooks/useCity";

type BlogPost = {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  featuredImage: string;
  imageAlt?: string;
  readTime?: number;
  publishedAt?: string;
  createdAt?: string;
};

type BlogsResponse = {
  items?: BlogPost[];
  data?: BlogPost[];
};

const fallbackImage = "/images/placeholder.svg";

function formatDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function BlogCard({ post }: { post: BlogPost }) {
  const date = formatDate(post.publishedAt ?? post.createdAt);

  return (
    <article className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/blogs/${post.slug}`} className="block">
        <div className="relative h-44 w-full overflow-hidden bg-gray-100 sm:h-48">
          <Image
            src={post.featuredImage || fallbackImage}
            alt={post.imageAlt || post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-[#26ad5f]">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <FiClock size={13} />
              {post.readTime ?? 5} min read
            </span>
          </div>

          <h2 className="line-clamp-2 text-lg font-semibold text-gray-950 transition-colors group-hover:text-[#26ad5f]">
            {post.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
            {post.excerpt}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-gray-400">{date}</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#26ad5f]">
              Read more <FiArrowRight size={15} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function BlogsClient() {
  const { selectedCity } = useCity();
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    setLoading(true);

    getBlogs({
      limit: 8,
      published: true,
      sortBy: "publishedAt",
      sortOrder: "desc",
      category: activeCategory === "All" ? undefined : activeCategory,
    })
      .then((res: BlogsResponse) => {
        if (!isActive) return;

        const nextPosts = res.items ?? res.data ?? [];

        setPosts(nextPosts);

        if (activeCategory === "All") {
          const apiCategories = nextPosts
            .map((post) => post.category)
            .filter((category): category is string => Boolean(category));

          setCategories(["All", ...Array.from(new Set(apiCategories))]);
        }
      })
      .catch((err) => {
        if (!isActive) return;

        console.error("Blog fetch failed:", err);
        setPosts([]);
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [activeCategory]);

  return (
    <section className="w-full">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="headingSideBar">
          <h1 className="text-base font-bold sm:text-2xl truncate">
            Property Blogs
          </h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-base truncate">
            Fresh real estate insights for {selectedCity?.city ?? "Hyderabad"}
          </p>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((category) => {
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-[#26ad5f] bg-[#26ad5f] text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50"
              }`}
            >
              {category}
            </button>
          );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[360px] animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="h-48 rounded-t-xl bg-gray-100" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-24 rounded bg-gray-100" />
                <div className="h-5 w-full rounded bg-gray-100" />
                <div className="h-5 w-3/4 rounded bg-gray-100" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-2/3 rounded bg-gray-100" />
              </div>
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <BlogCard key={post._id ?? post.slug} post={post} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 sm:col-span-2 xl:col-span-4">
            No blogs found.
          </div>
        )}
      </div>
    </section>
  );
}
 
