import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getFeaturedSlugProjects, incrementProjectClicks } from "@/data/serverData";
import { FeaturedProject } from "@/types";
import HeroSection from "./HeroSection";
import Overview from "./Overview";
import ProjectImages from "./ProjectImages";
import FloorPlan from "./FloorPlan";
import Amenities from "./Amenities";
import LocationMap from "./LocationMap";
import Specifications from "./Specifications";
import AboutProject from "./AboutProject";
import ContactSeller from "./ContactSeller";
import ProjectVideos from "./ProjectVideos";
import BrochurePreview from "./BrochurePreview";
import ProjectViewDurationTracker from "../../prime/[slug]/ProjectViewDurationTracker";
import ProjectViewTracker from "@/components/tracking/ProjectViewTracker";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = await getFeaturedSlugProjects({ slug });

  if (!project) {
    return {
      title: "Project Not Found",
      description: "Project not found",
    };
  }

  return {
    title: project.metaTitle || project.title,
    description: project.metaDescription || project.heroDescription,
    keywords: project.metaKeywords,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  let project: FeaturedProject | null = null;

  try {
    project = await getFeaturedSlugProjects({ slug });
  } catch (error) {
    console.error("Error fetching project:", error);
  }

  if (!project) {
    notFound();
  }

  if (project._id) {
    incrementProjectClicks(project._id).catch((e) =>
      console.error("Failed to increment project clicks:", e)
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <ProjectViewDurationTracker projectId={project._id} />
      <ProjectViewTracker projectId={project._id} title={project.title} slug={project.slug} locality={project.locality} city={project.city} state={project.state} promotionType={project.promotion?.type || "normal"} />
      <ProjectViewDurationTracker projectId={project._id} />
      <HeroSection project={project} />
      <section className="bg-emerald-50/60 py-5">
        <div className="mx-0 flex min-w-0 flex-col gap-5 sm:mx-4 lg:mx-5 lg:flex-row lg:items-start xl:mx-28 2xl:mx-34">
          <div className="w-full min-w-0 flex-1 space-y-4">
            <Overview project={project} />
            <FloorPlan project={project} />
            <Amenities project={project} />
            <LocationMap project={project} />
            <Specifications project={project} />
            <ProjectImages project={project} />
            <ProjectVideos project={project} />
            <AboutProject project={project} />
            <BrochurePreview project={project} />
          </div>

          <div className="w-full shrink-0 lg:sticky lg:top-20 lg:w-80 xl:w-[340px]">
            <ContactSeller project={project} />
          </div>
        </div>
      </section>
    </main>
  );
}


