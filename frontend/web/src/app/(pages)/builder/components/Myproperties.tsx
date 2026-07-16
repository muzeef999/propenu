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
  detailsBasePath?: "/prime" | "/project";
}

const getPromotionBadge = (project: FeaturedProject) => {
  switch (project.promotion?.type) {
    case "prime":
      return {
        label: "Prime Project",
        className: "bg-amber-100 text-amber-700",
      };
    case "featured":
      return {
        label: "Top Selling",
        className: "bg-blue-100 text-blue-700",
      };
    case "sponsored":
      return {
        label: "Sponsored",
        className: "bg-emerald-100 text-emerald-700",
      };
    default:
      return {
        label: "Normal",
        className: "bg-slate-100 text-slate-600",
      };
  }
};

const getProjectConfig = (project: FeaturedProject) => {
  if (project.categoryType?.toLowerCase() === "land") {
    return project.propertyType || "Land";
  }

  const summary = project.projectSummary || project.bhkSummary || [];
  const labels = summary
    .map((item) => item.label || item.bhkLabel || item.name)
    .filter(Boolean);

  return labels.length ? labels.slice(0, 2).join(", ") : "Premium Homes";
};

const getProjectPrice = (project: FeaturedProject) => {
  if (project.priceFrom) return formatINR(project.priceFrom);
  if (project.priceTo) return formatINR(project.priceTo);
  return "Price on request";
};

const getProjectLocation = (project: FeaturedProject) =>
  [project.locality, project.city].filter(Boolean).join(", ") ||
  "Location not available";

const getProjectDetailsHref = (
  project: FeaturedProject,
  detailsBasePath?: "/prime" | "/project",
) => {
  const basePath =
    detailsBasePath ??
    (project.promotion?.type === "prime" ? "/prime" : "/project");

  return `${basePath}/${project.slug}`;
};

const Myproperties: React.FC<ProjectCardProps> = ({
  items,
  project,
  detailsBasePath,
}) => {
  const list = items ?? (project ? [project] : []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-3">
        {list.map((project) => {
          const promotionBadge = getPromotionBadge(project);
          const detailsHref = getProjectDetailsHref(project, detailsBasePath);

          return (
            <article
              key={project._id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Hero Image */}
              <Link
                href={detailsHref}
                className="relative block overflow-hidden"
              >
                <span
                  className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm ${promotionBadge.className}`}
                >
                  {promotionBadge.label}
                </span>

                <img
                  src={project.heroImage ?? "/images/placeholder.svg"}
                  alt={project.title}
                  className="h-55 w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </Link>

              <div className="p-3">
                {/* Logo + Details */}
                <div className="flex items-start gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                    <Image
                      src={project.logo?.url ?? "/images/placeholder.svg"}
                      alt={project.title}
                      width={36}
                      height={36}
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1">
                      {project.propertyType && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-600">
                          {project.propertyType}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-1 line-clamp-1 text-sm font-semibold text-gray-900">
                      {project.title}
                    </h2>

                    <p className="line-clamp-1 text-[11px] text-gray-500">
                      {getProjectLocation(project)}
                    </p>
                  </div>
                </div>

                {/* Price & Config */}
                <div className="mt-3 flex items-center justify-between rounded-md bg-gray-50 px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500">Configuration</p>
                    <p className="truncate text-xs font-semibold text-gray-900">
                      {getProjectConfig(project)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-gray-500">Price</p>
                    <p className="text-sm font-bold text-primary">
                      {getProjectPrice(project)}
                    </p>
                  </div>
                </div>

                {/* Address */}
                {project.address && (
                  <p className="mt-2 line-clamp-1 text-[11px] text-gray-500">
                    {project.address}
                  </p>
                )}

                {/* Button */}
                <Link
                  href={detailsHref}
                  className="mt-3 flex h-9 w-full items-center justify-center rounded-md bg-[#27AE60] text-xs font-semibold text-white no-underline visited:text-white hover:bg-[#219653]"
                >
                  View Details
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Myproperties;
