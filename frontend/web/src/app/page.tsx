export const dynamic = "force-dynamic";

import TestomianalHome from "./(pages)/reviews/TestomianalHome";
import ExploreMorePropertiesPage from "./(pages)/explore-properties/Explore-properties";
import SearchBox from "@/components/SearchBox";
import GetOwnerProperties from "./(pages)/owner-listed/PopularOwnerPropertiesServer";
import ExploreOurServices from "@/app/(pages)/explore-properties/ExploreOurServices";
import HighlightProjectsServer from "./(pages)/highlight-projects/HighlightProjectServer";
import AgentServer from "./(pages)/agent-connect/AgentServer";
import FeaturedProjectsServer from "./(pages)/featured/FeaturedProjectsServer";

export default function Home() {
  return (
    <div>
      <SearchBox />
      <br />
      <br />
      <div className="container mx-auto  space-y-5">
        <FeaturedProjectsServer />
        <HighlightProjectsServer />
        <GetOwnerProperties />
        <AgentServer />
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
