import { FeaturedProject } from "@/types";
import "server-only";

const url = process.env.API_URL


export async function getFeaturedProjects() {
    const res = await  fetch(`${url}/api/properties/featuredProject`, { next : { revalidate: 10 } });
    if(!res.ok) {
        throw new Error('Failed to fetch featured projects');
    }
    return res.json();
}

export async function getFeaturedSlugProjects({slug,}: {
  slug: string;}): Promise<FeaturedProject | null> {
  const res = await fetch(
    `${url}/api/properties/featuredProject/slug/${encodeURIComponent(slug)}`,
    {
      // next options control ISR/SSG behavior for App Router server fetch
      next: { revalidate: 10 },
      // optionally: cache: "no-store" if you want always fresh
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error("Failed to fetch featured project");
  }

  const data: FeaturedProject = await res.json();
  return data;
}

export async function getOwnerProperties() {
    const res = await fetch(`${url}/api/properties`, {next : { revalidate: 10}});
    if(!res.ok) {
        throw new Error('Failed to fetch popular Owner Properties');
    }
    return res.json();
} 