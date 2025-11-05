// app/components/FeaturedProjects.tsx
import { getFeaturedProjects } from "@/serverSideData/serverData";
import { FeaturedProject } from "@/types";
import Link from "next/link";
import { JSX } from "react";


export interface FeaturedProjectsResponse {
  items?: FeaturedProject[];
  [key: string]: any;
}

export default async function FeaturedProjects(): Promise<JSX.Element> {
  try {
    const data = await getFeaturedProjects();
    const typedData = data as FeaturedProjectsResponse | undefined;
    const items = typedData?.items ?? [];

    if (!items.length) {
      return (
        <div>
          <h3>No featured projects found</h3>
        </div>
      );
    }

    return (
      <div>
        {items.map((project: FeaturedProject) => {
          const priceFrom = project.priceFrom != null ? project.priceFrom.toLocaleString() : "—";
          const priceTo = project.priceTo != null ? project.priceTo.toLocaleString() : undefined;
          const currency = project.currency ?? "";

          return (
            <div className="card" style={{width:'40%'}}  key={project._id}
            >
              <Link href={`/featured/${project.slug}`} style={{ width: "100%", height: 140, overflow: "hidden", borderTopRightRadius:6, borderTopLeftRadius:6 }}>
                {/* If using Next.js Image, replace <img> with next/image */}
                <img
                  src={project.heroImage ?? "/images/placeholder.png"}
                  alt={project.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </Link>

              <div className="flex items-center  p-1 gap-2">
                <div className="basis-[20%]">
                  <h1>Logo</h1>
                 </div> 
                 <div className="basis-[60%]">
                 <h2 className="text-md font-regular">{project.title}</h2>
                  {project.featuredTagline && <p style={{ margin: "0 0 8px", color: "#555" }}>{project.featuredTagline}</p>}
                  </div>
                  <div className="basis-[30%]">
                    <p style={{ margin: 0, fontWeight: 600 }}>
                  {currency} {priceFrom}
                  {priceTo ? ` — ${currency} ${priceTo}` : ""}
                </p>
                  </div> 
                
                
              </div>
            </div>
          );
        })}
      </div>
    );
  } catch (err: any) {
    return <div>Error loading featured projects: {String(err?.message ?? err)}</div>;
  }
}
