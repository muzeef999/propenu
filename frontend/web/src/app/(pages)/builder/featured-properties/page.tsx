"use client";

import { getFeaturedProjectsDashboard } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import Myproperties from "../components/Myproperties";

type FeaturedProjectsDashboardResponse = {
  success: boolean;
  data: FeaturedProject[];
};

const Page = () => {
  const { data, error, isLoading } = useQuery<FeaturedProjectsDashboardResponse | null>({
    queryKey: ["featured-projects-dashboard"],
    queryFn: getFeaturedProjectsDashboard,
  });

  const featuredProjects = data?.data ?? [];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return (
    <div>
      <h1 className="text-2xl font-medium">My Featured Projects</h1>
      {featuredProjects.length > 0 ? (
        <div className="space-y-2">
          <Myproperties items={featuredProjects} />
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          <p>You have not added any projects yet.</p>
        </div>
      )}
    </div>
  );
};

export default Page;
