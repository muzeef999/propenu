"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getHighlightProjectBuilders } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import Myproperties from "../components/Myproperties";

type HighlightProjectsBuilderResponse = {
  success?: boolean;
  data: FeaturedProject[];
};

const page = () => {
  const { data, isLoading, isError } = useQuery<HighlightProjectsBuilderResponse | FeaturedProject[] | null>({
    queryKey: ["highlight-projects-builder"],
    queryFn: getHighlightProjectBuilders,
  });

  const projects = Array.isArray(data) ? data : data?.data ?? [];

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-500">Something went wrong</div>;
  }

  return (
    <div>
  <h1 className="text-2xl font-medium">My Projects</h1>

  <p className="text-sm text-gray-500 mt-1">
    Manage and track all your property projects in one place.
  </p>

  {projects.length > 0 ? (
    <div className="space-y-2 mt-4">
      <Myproperties items={projects} detailsBasePath="/project" />
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
