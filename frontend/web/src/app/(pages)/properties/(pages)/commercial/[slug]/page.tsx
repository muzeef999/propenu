import { getCommercialSlugProjects, getResidentialSlugProjects } from "@/data/serverData";
import { ICommercial } from "@/types/commercial";
import { IResidential } from "@/types/residential";
import { hexToRGBA } from "@/ui/hexToRGBA";
import { notFound } from "next/navigation";



type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};


const bgcolor = hexToRGBA("#27AE60", 0.1);
export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  let project: ICommercial | null;
  try {
    project = await getCommercialSlugProjects({ slug });
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
        <div style={{background:bgcolor}}>
            <div className="container">
            <h1>Residential</h1>
            </div>
        </div>
    )
}

