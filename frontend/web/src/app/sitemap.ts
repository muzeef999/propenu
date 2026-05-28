
import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://propenu.com";

/* ======================================================
   FETCH ALL PROJECTS
====================================================== */

async function getProjects() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/properties`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) {
      throw new Error(
        "Failed to fetch projects"
      );
    }

    const data = await res.json();

    return data?.data || [];
  } catch (error) {
    console.error(
      "Projects Sitemap Error:",
      error
    );

    return [];
  }
}

/* ======================================================
   FETCH PRIME PROJECTS
====================================================== */

async function getPrimeProjects() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/properties?promotion=prime`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) {
      throw new Error(
        "Failed to fetch prime projects"
      );
    }

    const data = await res.json();

    return data?.data || [];
  } catch (error) {
    console.error(
      "Prime Sitemap Error:",
      error
    );

    return [];
  }
}

/* ======================================================
   FETCH BLOGS
====================================================== */

async function getBlogs() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/blogs`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) {
      throw new Error(
        "Failed to fetch blogs"
      );
    }

    const data = await res.json();

    return data?.data || [];
  } catch (error) {
    console.error(
      "Blog Sitemap Error:",
      error
    );

    return [];
  }
}

/* ======================================================
   MAIN SITEMAP
====================================================== */

export default async function sitemap():
Promise<MetadataRoute.Sitemap> {

  /* ====================================================
     STATIC PAGES
  ==================================================== */

  const staticPages = [
    "",

    "/about",

    "/privacy",

    "/terms",

    "/help-center",

    "/safety-guide",

    "/explore-properties",

    "/highlight-projects",

    "/top-rated",

    "/builder",

    "/agent",

    "/agent-connect",

    "/plans",

    "/reviews",

    "/home-loans",

    "/home-care",

    "/interior-designer",

    "/postproperty",

    "/owner-listed",

    "/properties/residential",

    "/properties/commercial",

    "/properties/land",

    "/properties/agricultural",

    "/blogs",

    "/prime",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,

    lastModified: new Date(),

    changeFrequency:
      "daily" as const,

    priority:
      route === ""
        ? 1
        : 0.8,
  }));

  /* ====================================================
     FETCH DATA
  ==================================================== */

  const projects =
    await getProjects();

  const primeProjects =
    await getPrimeProjects();

  const blogs =
    await getBlogs();

  /* ====================================================
     DYNAMIC PROJECT PAGES
     /project/[slug]
  ==================================================== */

  const projectPages =
    projects.map((project: any) => ({
      url:
        `${BASE_URL}/project/${project.slug}`,

      lastModified: new Date(
        project.updatedAt ||
          project.createdAt ||
          Date.now()
      ),

      changeFrequency:
        "weekly" as const,

      priority: 0.9,
    }));

  /* ====================================================
     PRIME PROJECT PAGES
     /prime/[slug]
  ==================================================== */

  const primePages =
    primeProjects.map(
      (project: any) => ({
        url:
          `${BASE_URL}/prime/${project.slug}`,

        lastModified: new Date(
          project.updatedAt ||
            project.createdAt ||
            Date.now()
        ),

        changeFrequency:
          "weekly" as const,

        priority: 0.9,
      })
    );

  /* ====================================================
     BLOG PAGES
     /blogs/[slug]
  ==================================================== */

  const blogPages =
    blogs.map((blog: any) => ({
      url:
        `${BASE_URL}/blogs/${blog.slug}`,

      lastModified: new Date(
        blog.updatedAt ||
          blog.createdAt ||
          Date.now()
      ),

      changeFrequency:
        "weekly" as const,

      priority: 0.7,
    }));

  /* ====================================================
     FINAL RETURN
  ==================================================== */

  return [
    ...staticPages,

    ...projectPages,

    ...primePages,

    ...blogPages,
  ];
}
