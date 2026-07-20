"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getFeaturedProjectsDashboard,
  getHighlightProjectBuilders,
} from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import Myproperties from "../components/Myproperties";
import ActiveTabs from "@/ui/ActiveTabs";

type HighlightProjectsBuilderResponse = {
  success?: boolean;
  data: FeaturedProject[];
};

const PROJECT_TABS = [
  "All",
  "Normal",
  "Prime Project",
  "Top Selling Project",
  "Sponsored Project",
] as const;

const projectSkeletonCards = Array.from({ length: 4 });

function MyProjectsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-40 rounded-md bg-gray-200" />
      <div className="mt-2 h-4 w-80 max-w-full rounded-md bg-gray-100" />

      <div className="mt-5 flex flex-wrap gap-6 border-b border-gray-200 pb-3">
        {PROJECT_TABS.map((tab) => (
          <div
            key={tab}
            className="h-6 w-28 rounded-md bg-gray-100"
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {projectSkeletonCards.map((_, index) => (
          <div
            key={`project-skeleton-${index}`}
            className="overflow-hidden rounded-[10px] border border-[#d8d8d8] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
          >
            <div className="grid lg:grid-cols-2">
              <div className="h-[190px] bg-gray-200 sm:h-[210px] lg:h-[250px]" />

              <div className="p-3">
                <div className="flex items-start gap-3">
                  <div className="h-[46px] w-[46px] rounded-lg bg-gray-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-20 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-100" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                  <div className="space-y-2">
                    <div className="h-5 w-40 rounded bg-gray-200" />
                    <div className="h-3 w-28 rounded bg-gray-100" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="ml-auto h-4 w-20 rounded bg-gray-200" />
                    <div className="ml-auto h-3 w-16 rounded bg-gray-100" />
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-100" />

                <div className="grid gap-3 py-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, metaIndex) => (
                    <div key={`meta-skeleton-${metaIndex}`} className="space-y-2">
                      <div className="h-3 w-16 rounded bg-gray-100" />
                      <div className="h-4 w-20 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>

                <div className="rounded-[10px] bg-[#eef8f1] p-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
                    {Array.from({ length: 3 }).map((_, statIndex) => (
                      <div key={`stat-skeleton-${statIndex}`} className="space-y-2">
                        <div className="h-3 w-14 rounded bg-white/70" />
                        <div className="h-4 w-16 rounded bg-white" />
                      </div>
                    ))}
                    <div className="h-[30px] w-28 rounded-[7px] bg-[#b9e8ca]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const page = () => {
  const [activeTab, setActiveTab] =
    useState<(typeof PROJECT_TABS)[number]>("All");

  const { data, isLoading, isError } = useQuery<{
    regularProjects: HighlightProjectsBuilderResponse | FeaturedProject[] | null;
    primeProjects: HighlightProjectsBuilderResponse | FeaturedProject[] | null;
  }>({
    queryKey: ["highlight-projects-builder"],
    queryFn: async () => {
      const [regularProjects, primeProjects] = await Promise.all([
        getHighlightProjectBuilders(),
        getFeaturedProjectsDashboard(),
      ]);

      return {
        regularProjects,
        primeProjects,
      };
    },
  });

  const regularProjects = Array.isArray(data?.regularProjects)
    ? data.regularProjects
    : data?.regularProjects?.data ?? [];

  const primeProjects = Array.isArray(data?.primeProjects)
    ? data.primeProjects
    : data?.primeProjects?.data ?? [];

  const projects = useMemo(() => {
    const mergedProjects = [...primeProjects, ...regularProjects];
    const uniqueProjects = new Map<string, FeaturedProject>();

    mergedProjects.forEach((project) => {
      uniqueProjects.set(project._id, project);
    });

    return Array.from(uniqueProjects.values());
  }, [primeProjects, regularProjects]);

  const filteredProjects = useMemo(() => {
    switch (activeTab) {
      case "Normal":
        return projects.filter(
          (project) =>
            !project.promotion?.type || project.promotion.type === "normal",
        );
      case "Prime Project":
        return projects.filter((project) => project.promotion?.type === "prime");
      case "Top Selling Project":
        return projects.filter((project) => project.promotion?.type === "featured");
      case "Sponsored Project":
        return projects.filter((project) => project.promotion?.type === "sponsored");
      default:
        return projects;
    }
  }, [activeTab, projects]);

  if (isLoading) {
    return <MyProjectsSkeleton />;
  }

  if (isError) {
    return <MyProjectsSkeleton />;
  }

  return (
    <div>
      <h1 className="text-2xl font-medium">My Projects</h1>

      <p className="mt-1 text-sm text-gray-500">
        Manage and track all your property projects in one place.
      </p>

      {projects.length > 0 ? (
        <div className="mt-4 space-y-4">
          <ActiveTabs
            categories={[...PROJECT_TABS]}
            activeTab={activeTab}
            setActiveTab={(tab) =>
              setActiveTab(tab as (typeof PROJECT_TABS)[number])
            }
          />

          {filteredProjects.length > 0 ? (
            <div className="space-y-2">
              <Myproperties items={filteredProjects} />
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>No projects found in this tab.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          <p>You have not added any projects yet.</p>
        </div>
      )}
    </div>
  );
};

export default page;
