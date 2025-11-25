import { FeaturedProject } from "@/types";
import "server-only";

const url = process.env.API_URL


//Featured projects

export async function getFeaturedProjects() {
    const res = await  fetch(`${url}/api/properties/featured-project`, { next : { revalidate: 10 } });
    if(!res.ok) {
        throw new Error('Failed to fetch featured projects');
    }
    return res.json();
}

export async function getFeaturedSlugProjects({ slug }: { slug: string }) {
  const API_URL = process.env.API_URL; // <— this is the correct way

  if (!API_URL) {
    throw new Error("API_URL is not defined");
  }

  const res = await fetch(
    `${API_URL}/api/properties/featured-project/slug/${encodeURIComponent(
      slug
    )}`,
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

  return (await res.json()) as FeaturedProject;
}




//owner listed properties

export async function getOwnerProperties() {
    const res = await fetch(`${url}/api/properties/owners-properties`, {next : { revalidate: 10}});
    if(!res.ok) {
        throw new Error('Failed to fetch popular Owner Properties');
    }
    return res.json();
}



//top projects properties

export async function  getTopProjects() {
    const res = await fetch(`${url}/api/properties/top-projects`, {next : { revalidate: 10}});
    if(!res.ok) {
        throw new Error('Failed to fetch Top Projects');
    } 
    return res.json();
}