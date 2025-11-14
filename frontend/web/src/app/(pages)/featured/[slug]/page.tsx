import { notFound } from "next/navigation";
import { getFeaturedSlugProjects } from "@/serverSideData/serverData";
import { FeaturedProject } from "@/types";
import Image from "next/image";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {

  const { slug } = await params;
  let project: FeaturedProject | null;
  try {
    project = await getFeaturedSlugProjects({ slug });
  } catch (err) {
    console.error("Error fetching project:", err);
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p>Unable to load project. Try again later.</p>
      </main>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <div className="container">
      <nav className="flex justify-around items-center">
        <h1>logo</h1>
         <div className="flex">
          <li>Available Properties</li>
          <li>Amenities</li>
          <li>Map view</li>
          <li>Gallery</li>
          <li>Abouts us</li>
          <li>Brouches</li>
         </div>
      </nav>
      <div className="relative w-full h-screen">
        <Image
          src={project.heroImage}
          alt={project.title}
          fill
          priority
          className="object-cover"
        />
      </div>

      <h1 className="text-2xl font-bold">{project?.title}</h1>
      <div className="mt-4 text-xs text-gray-500">Slug: {project?.slug}</div>
    </div>
  );
}
