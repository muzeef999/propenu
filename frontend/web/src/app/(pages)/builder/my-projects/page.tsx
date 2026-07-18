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
  "Prime Project",
  "Top Selling Project",
  "Sponsored Project",
] as const;

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
    return <div className="p-6">Loading...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-500">Something went wrong</div>;
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
