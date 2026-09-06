"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiClock, FiSearch } from "react-icons/fi";
import { getBlogs } from "@/data/ClientData";

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
  author?: {
    name?: string;
    designation?: string;
  };
  tags?: string[];
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

function BlogCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  const date = formatDate(post.publishedAt ?? post.createdAt);

  return (
    <article className="group h-[500px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-100 hover:shadow-lg">
      <Link href={`/blogs/${post.slug}`} className="flex h-full w-full flex-col">
        <div className="relative aspect-16/10 w-full overflow-hidden bg-white">
          <Image
            src={post.featuredImage || fallbackImage}
            alt={post.imageAlt || post.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {post.category ? (
              <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-[#26ad5f]">
                {post.category}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <FiClock size={13} />
              {post.readTime ?? 5} min read
            </span>
          </div>

          <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-gray-950 transition-colors group-hover:text-[#26ad5f]">
            {post.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
            {post.excerpt}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-600">
                {post.author?.name || "Propenu Editorial"}
              </p>
              {date ? (
                <p className="mt-1 truncate text-xs font-medium text-gray-400">
                  {date}
                </p>
              ) : null}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#26ad5f]">
              Read more
              <FiArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function BlogSkeleton() {
  return (
    <div className="h-[500px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="aspect-16/10 animate-pulse bg-gray-100" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
        <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function BlogsPageClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    setLoading(true);
    getBlogs({
      limit: 48,
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
          const nextCategories = nextPosts
            .map((post) => post.category)
            .filter((category): category is string => Boolean(category));

          setCategories(["All", ...Array.from(new Set(nextCategories))]);
        }
      })
      .catch(() => {
        if (isActive) setPosts([]);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeCategory]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return posts;

    return posts.filter((post) =>
      [post.title, post.excerpt, post.category, ...(post.tags ?? [])]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [posts, query]);

  return (
    <main className="min-h-screen bg-[#F8FBF9]">
      <section className="border-b border-gray-100 bg-white">
        <div className="container flex flex-col gap-5 px-4 py-7 sm:py-9">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Real estate insights made simple
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Market updates, buying tips, project launches, and local property
              stories in one place.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px] lg:items-center">
            <label className="relative block">
              <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search blogs"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#26ad5f] focus:ring-4 focus:ring-green-100"
              />
            </label>

            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
              {filteredPosts.length} stories
            </div>
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
            {categories.map((category) => {
              const isActiveCategory = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActiveCategory
                      ? "border-[#26ad5f] bg-[#26ad5f] text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container px-4 py-8 sm:py-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <BlogSkeleton key={index} />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPosts.map((post, index) => (
              <BlogCard
                key={post._id ?? post.slug}
                post={post}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#26ad5f]">No blogs found</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">
              Try another search or category
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              Clear the search term or switch back to All to see more stories.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
