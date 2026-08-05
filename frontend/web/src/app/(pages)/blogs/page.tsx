"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiClock, FiSearch } from "react-icons/fi";
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

function BlogMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
      {post.category ? (
        <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-[#26ad5f]">
          {post.category}
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <FiClock className="h-3.5 w-3.5" />
        {post.readTime ?? 5} min read
      </span>
      <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
    </div>
  );
}

function FeaturedBlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group grid overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-[1.15fr_0.85fr]"
    >
      <div className="relative min-h-[260px] bg-gray-100 sm:min-h-[340px]">
        <Image
          src={post.featuredImage || fallbackImage}
          alt={post.imageAlt || post.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
        <BlogMeta post={post} />
        <h2 className="mt-4 text-2xl font-semibold leading-tight text-gray-950 sm:text-3xl">
          {post.title}
        </h2>
        <p className="mt-4 line-clamp-4 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
          {post.excerpt}
        </p>
        {post.author?.name ? (
          <p className="mt-5 text-sm font-medium text-gray-500">
            By <span className="text-gray-900">{post.author.name}</span>
          </p>
        ) : null}
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#26ad5f]">
          Read article <FiArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function LargeBlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group flex min-h-full flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={post.featuredImage || fallbackImage}
          alt={post.imageAlt || post.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <BlogMeta post={post} />
        <h2 className="mt-4 line-clamp-2 text-xl font-semibold leading-7 text-gray-950">
          {post.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="min-w-0 truncate text-xs font-medium text-gray-400">
            {post.author?.name || "Propenu Editorial"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#26ad5f]">
            Read more <FiArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BlogSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="aspect-video animate-pulse bg-gray-100" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
        <div className="h-6 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function Page() {
  const { selectedCity } = useCity();
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

  const featuredPost = filteredPosts[0];
  const regularPosts = featuredPost ? filteredPosts.slice(1) : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0 lg:min-w-0 lg:flex-1">
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

        <label className="relative w-full lg:w-[360px] lg:shrink-0">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search blogs"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#26ad5f] focus:ring-2 focus:ring-green-100"
          />
        </label>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <BlogSkeleton key={index} />
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-6">
          {featuredPost ? <FeaturedBlogCard post={featuredPost} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {regularPosts.map((post) => (
              <LargeBlogCard key={post._id ?? post.slug} post={post} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-950">No blogs found</h2>
          <p className="mt-2 text-sm text-gray-500">
            Try a different search or category.
          </p>
        </div>
      )}
    </main>
  );
}