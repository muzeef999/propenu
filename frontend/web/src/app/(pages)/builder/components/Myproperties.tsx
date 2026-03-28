"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FeaturedProject } from "@/types";
import formatINR from "@/utilies/PriceFormat";

interface ProjectCardProps {
  items?: FeaturedProject[];
  project?: FeaturedProject;
  title?: string;
  city?: string;
}

const Myproperties: React.FC<ProjectCardProps> = ({
  items,
  project,
}) => {
  const list = items ?? (project ? [project] : []);
  return (
    <div className="relative w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 p-1">
        {list.map((project) => (
          <div key={project._id} className="w-full card">
            <Link
              href={`/prime/${project.slug}`}
              className="block h-[200px] overflow-hidden rounded-t-md"
            >
              <img
                src={project.heroImage ?? "/images/placeholder.svg"}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </Link>

            <div className="p-3 flex justify-between items-center gap-4">
              <div className="shrink-0">
                <Image
                  src={project?.logo?.url ?? "/images/placeholder.svg"}
                  alt={project.title}
                  width={80}
                  height={80}
                  className="object-cover rounded-md"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {project.title}
                </h2>
                {project.address && (
                  <p className="text-sm text-gray-500 truncate">
                    {project.address}
                  </p>
                )}
              </div>

              <div className="text-right whitespace-nowrap">
                <p className="text-sm text-gray-500">2,3 BHK Flats</p>
                <p className="text-base font-medium">
                  {formatINR(project?.priceFrom)}
                  <span className="text-gray-400 text-xs"> onwards</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Myproperties;
