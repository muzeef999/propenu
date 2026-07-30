import type { Metadata } from "next";

type PropertyMetadataInput = {
  property: Record<string, any> | null;
  slug: string;
  propertyType: "residential" | "commercial" | "land" | "agricultural";
  propertyTypeLabel: string;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_WEB_URL ||
  "https://propenu.com";

const DEFAULT_IMAGE = "/images/spronsoreCard.png";

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
    .replace(/\s+/g, " ")
    .trim();
}

function formatPrice(value?: unknown) {
  if (value === undefined || value === null || value === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function firstImage(property: Record<string, any>) {
  return (
    property.gallery?.[0]?.url ||
    property.gallerySummary?.[0]?.url ||
    property.images?.[0]?.url ||
    property.images?.[0] ||
    property.image ||
    property.featuredImage ||
    DEFAULT_IMAGE
  );
}

function propertyLocation(property: Record<string, any>) {
  return [property.locality, property.city, property.state]
    .map(compactText)
    .filter(Boolean)
    .join(", ");
}

function propertyDescription(property: Record<string, any>, propertyTypeLabel: string) {
  const price = formatPrice(property.price);
  const location = propertyLocation(property);
  const area =
    property.carpetArea ||
    property.builtUpArea ||
    property.plotArea ||
    property.totalArea?.value;
  const areaUnit =
    property.plotAreaUnit ||
    property.totalArea?.unit ||
    "sqft";

  const highlights = [
    price,
    area ? `${area} ${areaUnit}` : "",
    location,
    property.listingType,
    propertyTypeLabel,
  ].map(compactText).filter(Boolean);

  return compactText(property.description) || highlights.join(" | ");
}

export function buildPropertyMetadata({
  property,
  slug,
  propertyType,
  propertyTypeLabel,
}: PropertyMetadataInput): Metadata {
  const fallbackTitle = `${propertyTypeLabel} Property in India | Propenu`;
  const canonicalPath = `/properties/${propertyType}/${slug}`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  if (!property) {
    return {
      title: fallbackTitle,
      description: "Explore verified properties on Propenu.",
      alternates: { canonical: canonicalUrl },
    };
  }

  const title = compactText(property.metaTitle || property.title || fallbackTitle);
  const description = propertyDescription(property, propertyTypeLabel).slice(0, 300);
  const imageUrl = absoluteUrl(firstImage(property));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Propenu",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
