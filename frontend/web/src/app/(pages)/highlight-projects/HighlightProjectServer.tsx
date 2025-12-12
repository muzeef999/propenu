import { getHighlightProjects } from "@/data/serverData";
import { FeaturedProject } from "@/types";
import { JSX } from "react";
import HighlightProjectsClient from "./HighlightProjectsClient"; 
export interface HighlightProjectsResponse {
  items?: FeaturedProject[];
  [key: string]: any;
}
 
export default async function HighlightProjectsServer(): Promise<JSX.Element> {
  try {
 
    const data = await getHighlightProjects();
    const typedData = data as HighlightProjectsResponse | undefined;
    const items = typedData?.items ?? [];
     
    if (!items.length) {
      return (
        <div>
          <h3>No featured projects found</h3>
        </div>
      );
    }
    return <HighlightProjectsClient items={items} />
  } catch (err: any) {
    return (
      <div>Error loading featured projects: {String(err?.message ?? err)}</div>
    );
  }
}