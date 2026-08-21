const SITE_NAME = "Propenu";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_WEB_URL ||
  "https://propenu.com";
const DEFAULT_IMAGE = "/images/placeholder.svg";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type BlogStructuredDataInput = {
  title: string;
  description?: string;
  slug: string;
  image?: string;
  imageAlt?: string;
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  category?: string;
  tags?: string[];
  faqs?: { question: string; answer: string }[];
};

type ListingStructuredDataInput = {
  title: string;
  description?: string;
  path: string;
  image?: string;
  category?: string;
  price?: number;
  currency?: string;
  address?: string;
  city?: string;
  state?: string;
  locality?: string;
  publishedAt?: string;
  updatedAt?: string;
  sellerName?: string;
};

function absoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return new URL(DEFAULT_IMAGE, SITE_URL).toString();

  try {
    return new URL(pathOrUrl).toString();
  } catch {
    return new URL(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`, SITE_URL).toString();
  }
}

function compactText(value?: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIsoDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function buildBreadcrumbList(path: string, items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(path)}#breadcrumbs`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildBlogPostingStructuredData(input: BlogStructuredDataInput) {
  const path = `/blogs/${input.slug}`;
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(input.image);
  const description = compactText(input.description);
  const publishedAt = normalizeIsoDate(input.publishedAt);
  const updatedAt = normalizeIsoDate(input.updatedAt || input.publishedAt);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: compactText(input.title),
      description,
      image: [
        {
          "@type": "ImageObject",
          url: imageUrl,
          caption: input.imageAlt || compactText(input.title),
        },
      ],
      articleSection: compactText(input.category),
      keywords: input.tags?.join(", "),
      datePublished: publishedAt,
      dateModified: updatedAt,
      mainEntityOfPage: url,
      author: {
        "@type": "Person",
        name: compactText(input.authorName) || "Propenu Editorial",
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
      isPartOf: {
        "@type": "Blog",
        "@id": `${absoluteUrl("/blogs")}#blog`,
        name: "Propenu Blogs",
        url: absoluteUrl("/blogs"),
      },
      inLanguage: "en-IN",
    },
    buildBreadcrumbList(path, [
      { name: "Home", path: "/" },
      { name: "Blogs", path: "/blogs" },
      { name: compactText(input.title), path },
    ]),
  ];

  const validFaqs = (input.faqs ?? []).filter(
    (faq) => compactText(faq.question) && compactText(faq.answer),
  );

  if (validFaqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: validFaqs.map((faq) => ({
        "@type": "Question",
        name: compactText(faq.question),
        acceptedAnswer: {
          "@type": "Answer",
          text: compactText(faq.answer),
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildListingStructuredData(
  input: ListingStructuredDataInput,
  parentLabel: string,
  parentPath: string,
) {
  const url = absoluteUrl(input.path);
  const imageUrl = absoluteUrl(input.image);
  const description = compactText(input.description);
  const updatedAt = normalizeIsoDate(input.updatedAt || input.publishedAt);
  const locationLabel = [input.locality, input.city, input.state]
    .map(compactText)
    .filter(Boolean)
    .join(", ");

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Product",
      "@id": `${url}#listing`,
      name: compactText(input.title),
      description,
      category: compactText(input.category),
      image: [imageUrl],
      url,
      brand: {
        "@type": "Brand",
        name: SITE_NAME,
      },
      seller: {
        "@type": "Organization",
        name: compactText(input.sellerName) || SITE_NAME,
      },
      areaServed: locationLabel || undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: input.currency || "INR",
        price:
          typeof input.price === "number" && Number.isFinite(input.price)
            ? input.price
            : undefined,
        availability: "https://schema.org/InStock",
        url,
      },
      location: locationLabel
        ? {
            "@type": "Place",
            name: locationLabel,
            address: {
              "@type": "PostalAddress",
              streetAddress: compactText(input.address),
              addressLocality: compactText(input.city || input.locality),
              addressRegion: compactText(input.state),
              addressCountry: "IN",
            },
          }
        : undefined,
      dateModified: updatedAt,
    },
    buildBreadcrumbList(input.path, [
      { name: "Home", path: "/" },
      { name: parentLabel, path: parentPath },
      { name: compactText(input.title), path: input.path },
    ]),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
