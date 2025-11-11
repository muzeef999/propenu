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
      <div className="flex flex-wrap gap-2"> {/* Now wraps into rows */}
        {items.map((project: FeaturedProject) => {
          const priceFrom =
            project.priceFrom != null ? project.priceFrom.toLocaleString() : "—";
          const priceTo =
            project.priceTo != null ? project.priceTo.toLocaleString() : undefined;
          const currency = project.currency ?? "";

          return (
            <div
              key={project._id}
              className="card w-1/2 border rounded-md bg-white shadow-sm"
            >
              <Link
                href={`/featured/${project.slug}`}
                className="block w-full h-[140px] overflow-hidden rounded-t-md"
              >
                <img
                  src={project.heroImage ?? "/images/placeholder.png"}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex items-center p-2 gap-2">
                {/* Logo */}
                <div className="basis-[20%]">
                  <h1>Logo</h1>
                </div>

                {/* Title + Tagline */}
                <div className="basis-[60%]">
                  <h2 className="text-md font-medium">{project.title}</h2>
                  {project.featuredTagline && (
                    <p className="text-gray-600 text-sm">
                      {project.featuredTagline}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="basis-[30%] text-right">
                  <p className="font-semibold">
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
    return (
      <div>Error loading featured projects: {String(err?.message ?? err)}</div>
    );
  }
}
