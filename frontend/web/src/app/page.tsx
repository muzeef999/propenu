export const dynamic = "force-dynamic";

import TestomianalHome from "./(pages)/reviews/TestomianalHome";
import ExploreMorePropertiesPage from "./(pages)/explore-properties/Explore-properties";
import SearchBox from "@/components/SearchBox";
import ExploreOurServices from "@/app/(pages)/explore-properties/ExploreOurServices";
import FeaturedProjectsClient from "./(pages)/featured/FeaturedProjectsClient";
import HighlightProjectsClient from "./(pages)/highlight-projects/HighlightProjectsClient";
import AgentsList from "./(pages)/agent-connect/AgentCard";
import PopularOwnerPropertiesClient from "./(pages)/owner-listed/PopularOwnerPropertiesClient";

export default function Home() {
  return (
    <div>
      <SearchBox />
      <div className="container mx-auto  space-y-10">
        <FeaturedProjectsClient />
        <HighlightProjectsClient />
        <PopularOwnerPropertiesClient />
        <AgentsList />
        <ExploreOurServices />
        <div>
          <div className="headingSideBar">
            <h1 className="text-base font-bold sm:text-2xl truncate">
              Explore Properties in hyderabad
            </h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              Find apartments, villas, farmhouses, and residential plots in top
              localities.
            </p>
          </div>
          <ExploreMorePropertiesPage />
        </div>
        <TestomianalHome />
      </div>
    </div>
  );
}
