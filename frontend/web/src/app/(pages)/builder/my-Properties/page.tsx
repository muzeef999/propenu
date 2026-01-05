"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getHighlightProjectBuilders } from "@/data/ClientData";
import { FeaturedProject } from "@/types";
import Myproperties from "../components/Myproperties";

const page = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["highlight-projects-builder"],
    queryFn: getHighlightProjectBuilders,
    select: (res) => res?.data ?? res,
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-500">Something went wrong</div>;
  }

  return (
    <div className="">
      <h1 className="text-2xl font-medium ">My Projects</h1>
      {data && (data as FeaturedProject[]).length > 0 ? (
        <div className="space-y-2 grid grid-cols-2">
          {(data as FeaturedProject[])?.map((project) => (
            <Myproperties key={project._id} project={project} />
          ))}
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
