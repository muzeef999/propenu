import "server-only";

export async function getFeaturedProjects() {
    const res = await  fetch('http://localhost:4003/featuredProject', { next : { revalidate: 10 } });
    if(!res.ok) {
        throw new Error('Failed to fetch featured projects');
    }
    return res.json();
}

export async function getOwnerProperties() {
    const res = await fetch('http://localhost:4003/property', {next : { revalidate: 10}});
    if(!res.ok) {
        throw new Error('Failed to fetch popular Owner Properties');
    }
    return res.json();
} 