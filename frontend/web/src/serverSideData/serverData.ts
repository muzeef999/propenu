import "server-only";

const url = process.env.API_URL


export async function getFeaturedProjects() {
    const res = await  fetch(`${url}/api/properties/featuredProject`, { next : { revalidate: 10 } });
    if(!res.ok) {
        throw new Error('Failed to fetch featured projects');
    }
    return res.json();
}

export async function getOwnerProperties() {
    const res = await fetch(`${url}/api/properties`, {next : { revalidate: 10}});
    if(!res.ok) {
        throw new Error('Failed to fetch popular Owner Properties');
    }
    return res.json();
} 