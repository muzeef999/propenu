import { FeaturedProject } from "@/types";
import { IAgricultural } from "@/types/agricultural";
import { ICommercial } from "@/types/commercial";
import { ILand } from "@/types/land";
import { IResidential } from "@/types/residential";

const url = process.env.NEXT_PUBLIC_API_URL


export type BlogDetail = {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  imageAlt?: string;
  content: string;
  articleSections?: {
    heading?: string;
    content?: string;
  }[];
  author?: {
    name?: string;
    profileImage?: string;
    designation?: string;
    description?: string;
  };
  category: string;
  tags?: string[];
  faqs?: {
    question: string;
    answer: string;
  }[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  publishedAt?: string;
  createdAt?: string;
  readTime?: number;
  views?: number;
  likes?: number;
  shares?: number;
};

export type BlogPreview = {
  _id?: string;
  title: string;
  slug: string;
  featuredImage?: string;
  imageAlt?: string;
  category?: string;
  views?: number;
  likes?: number;
  shares?: number;
};

export async function getBlogBySlug({ slug }: { slug: string }) {
  const res = await fetch(
    `${url}/api/properties/blogs/slug/${encodeURIComponent(slug)}`,
    {
      next: { revalidate: 10 },
    }
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to fetch blog");
  }

  const json = await res.json();
  return json.data as BlogDetail;
}

export async function getBlogArticleLists() {
  const res = await fetch(`${url}/api/properties/blogs?published=true&limit=1`, {
    next: { revalidate: 10 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch blog article lists");
  }

  const json = await res.json();

  return {
    recentArticles: (json.recentArticles ?? []) as BlogPreview[],
    popularArticles: (json.popularArticles ?? []) as BlogPreview[],
  };
}


export async function getFeaturedSlugProjects({ slug }: { slug: string }) {
  const res = await fetch(`${url}/api/properties/featured-project/slug/${encodeURIComponent( slug )}`,
    {
      next: { revalidate: 10 }, // ISR – recommended by Next.js
    }
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch featured project");
  }
  const json = await res.json();
  return json.data as FeaturedProject;
}

export async function incrementProjectClicks(id: string) {
  try {
    const res = await fetch(`${url}/api/properties/featured-project/${id}/click`, {
      method: "POST",
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Failed to increment project clicks:", await res.text());
    }
  } catch (err) {
    console.error("Error incrementing project clicks:", err);
  }
}







//top projects properties
export async function  getTopProjects() {
    const res = await fetch(`${url}/api/properties/top-projects`, {next : { revalidate: 10}});
    if(!res.ok) {
        throw new Error('Failed to fetch Top Projects');
    } 
    return res.json();
}


//residential

export async function getResidentialSlugProjects ({ slug }: { slug: string }) {
  
  const res = await fetch(`${url}/api/properties/residential/slug/${encodeURIComponent( slug )}`,
    {
      next: { revalidate: 10 }, // ISR – recommended by Next.js
    }
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch featured project");
  }
  const json = await res.json();
 return {
    ...json.data,
    relatedProjects: json.relatedProjects ?? [],
  } as IResidential;
}


//commercial
export async function getCommercialSlugProjects ({ slug }: { slug: string }) {
 
  const res = await fetch(`${url}/api/properties/commercial/slug/${encodeURIComponent( slug )}`,
    {
      next: { revalidate: 10 }, // ISR – recommended by Next.js
    }
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch featured project");
  }
  const json = await res.json();
  return json.data as ICommercial;
}

//agricultural

export async function getAgriculturalSlugProjects ({ slug }: { slug: string }) {

  const res = await fetch(`${url}/api/properties/agricultural/slug/${encodeURIComponent( slug )}`,
    {
      next: { revalidate: 10 }, // ISR – recommended by Next.js
    }
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch featured project");
  }
  const json = await res.json();
  return json.data as IAgricultural;
}

//land

export async function  getLandSlugProjects ({ slug }: { slug: string }) {

  const res = await fetch(`${url}/api/properties/land/slug/${encodeURIComponent( slug )}`,
    {
      next: { revalidate: 10 }, // ISR – recommended by Next.js
    }
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch featured project");
  }
  const json = await res.json();
  return json.data as ILand;
}

export async function getAgentDetails({ slug }: { slug: string }) {
  const res = await fetch(`${url}/api/users/agent/slug/${encodeURIComponent(slug)}`,
    {
      next: { revalidate: 10 }, // ISR – recommended by Next.js
    }
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch agent details");
  }
  const json = await res.json();
  return json.data;
}
