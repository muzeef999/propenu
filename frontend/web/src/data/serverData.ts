import { FeaturedProject } from "@/types";
import { IAgricultural } from "@/types/agricultural";
import { ICommercial } from "@/types/commercial";
import { ILand } from "@/types/land";
import { IResidential } from "@/types/residential";
import "server-only";

const url = process.env.NEXT_PUBLIC_API_URL



export async function getFeaturedProjects() {
    const res = await  fetch(`${url}/api/properties/featured-project`, { next : { revalidate: 10 } });
    if(!res.ok) {
        throw new Error('Failed to fetch featured projects');
    }
    return res.json();
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


//highlight projects
export async function getHighlightProjects() {
    const res = await fetch(`${url}/api/properties/highlight-projects`, {next : { revalidate: 10}});
    if(!res.ok) {
        throw new Error('Failed to fetch highlight projects');
    }
    return res.json();
}




//owner listed properties
export async function getOwnerProperties() {
    const res = await fetch(`${url}/api/properties/owners-properties`, {next : { revalidate: 10}});
    if(!res.ok) {
        throw new Error('Failed to fetch popular Owner Properties');
    }
    return res.json();
}


export async function getAgentConnect(){
  const res = await fetch(`${url}/api/users/agent`, {next : { revalidate: 10}});
  if(!res.ok) {
      throw new Error('Failed to fetch Agent Connect data');
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
  return json.data as IResidential;

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