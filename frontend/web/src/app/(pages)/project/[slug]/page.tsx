import { notFound } from "next/navigation";
import { getFeaturedSlugProjects } from "@/data/serverData";
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

  return (
    <main className="min-h-screen bg-white">
      <HeroSection project={project} />
      <section className="bg-emerald-50/60 py-5">
        <div className="container mx-auto flex flex-col gap-5 px-1 sm:px-4 lg:flex-row lg:items-start lg:px-3">
          <div className="w-full space-y-4 lg:w-[80%]">
            <Overview project={project} />
            <ProjectImages project={project} />
            <FloorPlan project={project} />
            <Amenities project={project} />
            <LocationMap project={project} />
            <Specifications project={project} />
            <AboutProject project={project} />
          </div>

          <div className="w-full lg:w-[30%] sticky top-20">
            <ContactSeller project={project} />
          </div>
        </div>
      </section>
    </main>
  );
}
