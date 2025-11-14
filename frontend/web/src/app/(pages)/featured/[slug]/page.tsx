// app/featured/[slug]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import { getFeaturedSlugProjects } from "@/serverSideData/serverData";
import { FeaturedProject } from "@/types";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // server-side fetch (this component runs on the server by default)
  let project: FeaturedProject | null;
  try {
    project = await getFeaturedSlugProjects({ slug });
  } catch (err) {
    // optionally log server-side error, then show notFound or an error UI
    console.error("Error fetching project:", err);
    // you can choose to throw or show fallback UI. Here's notFound fallback:
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p>Unable to load project. Try again later.</p>
      </main>
    );
  }

  if (!project) {
    // render Next.js 404
    notFound();
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{project.title}</h1>

      {/* example: show slug and a back link */}
      <div className="mt-4 text-xs text-gray-500">Slug: {project.slug}</div>
    </main>
  );
}
