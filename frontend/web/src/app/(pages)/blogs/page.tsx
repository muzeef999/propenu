import type { Metadata } from "next";
import Script from "next/script";
import BlogsPageClient from "./BlogsPageClient";
import { getBlogs } from "@/data/serverData";

const SITE_NAME = "Propenu";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_WEB_URL ||
  "https://propenu.com";
const BLOGS_PATH = "/blogs";
const BLOGS_URL = new URL(BLOGS_PATH, SITE_URL).toString();
const DEFAULT_IMAGE = new URL("/images/placeholder.svg", SITE_URL).toString();
const PAGE_TITLE = "Real Estate Blogs, Market Updates & Buying Tips | Propenu";
const PAGE_DESCRIPTION =
  "Explore Propenu blogs for real estate market updates, buying and selling tips, project launches, and local property insights across India.";

type BlogListItem = {
  _id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  featuredImage?: string;
  imageAlt?: string;
  readTime?: number;
  publishedAt?: string;
  createdAt?: string;
  tags?: string[];
};

function absoluteImageUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return DEFAULT_IMAGE;

  try {
    return new URL(pathOrUrl).toString();
  } catch {
    const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return new URL(normalizedPath, SITE_URL).toString();
  }
}

function isoDate(value?: string) {
  if (!value) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function compactText(value?: string) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "Propenu blogs",
    "real estate blog India",
    "property buying tips",
    "property market updates",
    "real estate launches",
    "home buying guide",
  ],
  alternates: {
    canonical: BLOGS_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: BLOGS_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: DEFAULT_IMAGE,
        width: 1200,
        height: 630,
        alt: "Propenu blogs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [DEFAULT_IMAGE],
  },
};

async function getStructuredDataPosts() {
  try {
    const response = await getBlogs({
      limit: 12,
      published: true,
      sortBy: "publishedAt",
      sortOrder: "desc",
    });

    return response.items as BlogListItem[];
  } catch (error) {
    console.error("Blogs SEO fetch failed:", error);
    return [];
  }
}

export default async function Page() {
  const posts = await getStructuredDataPosts();

  const itemListElements = posts.map((post, index) => {
    const publishedAt = isoDate(post.publishedAt ?? post.createdAt);

    return {
      "@type": "ListItem",
      position: index + 1,
      url: `${BLOGS_URL}/${post.slug}`,
      item: {
        "@type": "BlogPosting",
        headline: compactText(post.title),
        description: compactText(post.excerpt),
        articleSection: compactText(post.category),
        image: [absoluteImageUrl(post.featuredImage)],
        datePublished: publishedAt,
        dateModified: publishedAt,
        timeRequired: `PT${post.readTime ?? 5}M`,
        keywords: post.tags?.join(", "),
        author: {
          "@type": "Organization",
          name: SITE_NAME,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
        },
        mainEntityOfPage: `${BLOGS_URL}/${post.slug}`,
      },
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${BLOGS_URL}#blog`,
        url: BLOGS_URL,
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
        inLanguage: "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${BLOGS_URL}#breadcrumbs`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blogs",
            item: BLOGS_URL,
          },
        ],
      },
      ...(itemListElements.length > 0
        ? [
            {
              "@type": "ItemList",
              "@id": `${BLOGS_URL}#items`,
              itemListElement: itemListElements,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <Script
        id="blogs-list-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogsPageClient />
    </>
  );
}
