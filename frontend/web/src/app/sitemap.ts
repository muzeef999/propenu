import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

/* =========================================================
   FETCH ALL PROJECTS
========================================================= */

async function getProjects() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-properties`,
      {
        next: {
          revalidate: 3600,
        },
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch projects");
    }

    const data = await res.json();

    return data?.items || [];
  } catch (error) {
    console.error("Sitemap Projects Error:", error);

    return [];
  }
}

/* =========================================================
   FETCH LOCATIONS
========================================================= */

async function getLocations() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locations`, {
      next: {
        revalidate: 3600,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch locations");
    }

    return await res.json();
  } catch (error) {
    console.error("Sitemap Locations Error:", error);

    return {
      cities: [],
      localities: [],
    };
  }
}

/* =========================================================
   MAIN SITEMAP
========================================================= */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* =====================================================
     STATIC PAGES
  ===================================================== */

  const staticPages = [
    "",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms-and-conditions",

    // property categories
    "/residential",
    "/commercial",
    "/plots",
    "/agriculture",

    // optional pages
    "/featured-projects",
    "/builders",
    "/blogs",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,

    lastModified: new Date(),

    changeFrequency: "daily" as const,

    priority: route === "" ? 1 : 0.8,
  }));

  /* =====================================================
     FETCH DATA
  ===================================================== */

  const projects = await getProjects();

  const locations = await getLocations();

  /* =====================================================
     PROPERTY DETAIL PAGES
  ===================================================== */

  const projectPages = projects.map((project: any) => ({
    url: `${BASE_URL}/projects/${project.slug}`,

    lastModified: new Date(
      project.updatedAt || project.createdAt || Date.now(),
    ),

    changeFrequency: "weekly" as const,

    priority: 0.9,
  }));

  /* =====================================================
     PROPERTY TYPE + CITY PAGES
     Example:
     /residential/hyderabad
  ===================================================== */

  const propertyTypes = ["residential", "commercial", "plots", "agriculture"];

  const cityPages = (locations?.cities || []).flatMap((city: any) =>
    propertyTypes.map((type) => ({
      url: `${BASE_URL}/${type}/${city.slug}`,

      lastModified: new Date(),

      changeFrequency: "daily" as const,

      priority: 0.8,
    })),
  );

  /* =====================================================
     LOCALITY PAGES
     Example:
     /residential/hyderabad/gachibowli
  ===================================================== */

  const localityPages = (locations?.localities || []).flatMap((locality: any) =>
    propertyTypes.map((type) => ({
      url: `${BASE_URL}/${type}/${locality.citySlug}/${locality.slug}`,

      lastModified: new Date(),

      changeFrequency: "daily" as const,

      priority: 0.8,
    })),
  );

  /* =====================================================
     UNIQUE CITY LANDING PAGES
     Example:
     /hyderabad
  ===================================================== */

  const simpleCityPages = (locations?.cities || []).map((city: any) => ({
    url: `${BASE_URL}/${city.slug}`,

    lastModified: new Date(),

    changeFrequency: "daily" as const,

    priority: 0.7,
  }));

  /* =====================================================
     FINAL RETURN
  ===================================================== */

  return [
    ...staticPages,

    ...projectPages,

    ...cityPages,

    ...localityPages,

    ...simpleCityPages,
  ];
}
