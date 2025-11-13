// app/components/FeaturedProjects.tsx
import { getFeaturedProjects } from "@/serverSideData/serverData";
import { FeaturedProject } from "@/types";
import { JSX } from "react";
import FeaturedProjectsClient from "./FeaturedProjectsClient";

export interface FeaturedProjectsResponse {
  items?: FeaturedProject[];
  [key: string]: any;
}

export default async function FeaturedProjectsServer(): Promise<JSX.Element> {
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

    return <FeaturedProjectsClient items={items} />
  } catch (err: any) {
    return (
      <div>Error loading featured projects: {String(err?.message ?? err)}</div>
    );
  }
}
