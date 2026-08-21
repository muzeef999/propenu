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

function BlogMeta({
  post,
  light = false,
}: {
  post: BlogPost;
  light?: boolean;
}) {
  const textClass = light ? "text-white/80" : "text-slate-500";
  const badgeClass = light
    ? "bg-white/12 text-white ring-1 ring-white/20"
    : "bg-emerald-50 text-emerald-700";

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${textClass}`}>
      {post.category ? (
        <span
          className={`rounded-full px-3 py-1 font-semibold uppercase tracking-[0.18em] ${badgeClass}`}
        >
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

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function FeaturedBlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
    >
      <div className="relative min-h-[260px] overflow-hidden bg-slate-100 lg:min-h-[420px]">
        <Image
          src={post.featuredImage || fallbackImage}
          alt={post.imageAlt || post.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/78 via-slate-950/28 to-transparent" />
      </div>

      <div className="border-t border-slate-200 bg-white p-5 sm:p-6 lg:p-7">
        <BlogMeta post={post} />
        <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl lg:text-[2rem]">
          {post.title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          {post.excerpt}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span>{post.author?.name || "Propenu Editorial"}</span>
          {post.tags?.length ? (
            <span className="truncate text-slate-400">
              {post.tags.slice(0, 2).map((tag) => `#${tag}`).join(" ")}
            </span>
          ) : null}
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
          Read more
          <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

function CompactStoryCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 hover:border-emerald-200 hover:shadow-sm"
    >
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={post.featuredImage || fallbackImage}
          alt={post.imageAlt || post.title}
          fill
          sizes="128px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <BlogMeta post={post} />
        <h3 className="mt-3 line-clamp-2 text-xl font-semibold leading-8 text-slate-950 transition-colors group-hover:text-emerald-700">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600">
          {post.excerpt}
        </p>
      </div>
    </Link>
  );
}

function StoryGridCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        <Image
          src={post.featuredImage || fallbackImage}
          alt={post.imageAlt || post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <BlogMeta post={post} />
        <h3 className="mt-4 line-clamp-2 text-lg font-semibold leading-7 text-slate-950">
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="min-w-0 truncate text-sm text-slate-500">
            {post.author?.name || "Propenu Editorial"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-emerald-700">
            Read
            <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BlogSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex gap-4 rounded-3xl border border-slate-200/80 bg-white p-4">
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white">
      <div className="aspect-4/3 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-5 sm:p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="h-7 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-7 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
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

  const featuredPost = filteredPosts[0];
  const spotlightPosts = featuredPost ? filteredPosts.slice(1, 4) : [];
  const gridPosts = featuredPost ? filteredPosts.slice(4) : filteredPosts;

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-slate-200">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
              Blogs
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Market updates, launches, buying tips, and local insights.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px] lg:items-center">
            <label className="relative block">
              <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, topic or tag"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {filteredPosts.length} stories
            </div>
          </div>

          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
            {categories.map((category) => {
              const isActiveCategory = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    isActiveCategory
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {loading ? (
          <>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.7fr)]">
              <div className="min-h-[460px] animate-pulse rounded-4xl bg-slate-200" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <BlogSkeleton key={`compact-${index}`} compact />
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <BlogSkeleton key={index} />
              ))}
            </div>
          </>
        ) : filteredPosts.length > 0 ? (
          <>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_380px] lg:items-start">
              <div>
                {featuredPost ? <FeaturedBlogCard post={featuredPost} /> : null}
              </div>

              <div className="space-y-5">
                <SectionHeading
                  title="Recent highlights"
                  description="Short reads and timely updates"
                />
                {spotlightPosts.map((post) => (
                  <CompactStoryCard key={post._id ?? post.slug} post={post} />
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <SectionHeading
                title="All posts"
                description="Browse the latest articles across updates, launches, advice, and city-specific stories"
              />
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {gridPosts.map((post) => (
                  <StoryGridCard key={post._id ?? post.slug} post={post} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white/90 px-6 py-16 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              No Matches
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">
              No blogs found for this view
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Try a different search term or switch categories to widen the list.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
