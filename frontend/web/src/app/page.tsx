export const dynamic = "force-dynamic";

import TestomianalHome from "./(pages)/reviews/TestomianalHome";
import ExploreMorePropertiesPage from "./(pages)/explore-properties/Explore-properties";
import SearchBox from "@/components/SearchBox";
import FeaturedProjectsServer from "./(pages)/featured/FeaturedProjectsServer";
import GetOwnerProperties from "./(pages)/owner-listed/PopularOwnerPropertiesServer";
import ExploreOurServices from "@/app/(pages)/explore-properties/ExploreOurServices";
import HighlightProjectsServer from "./(pages)/highlight-projects/HighlightProjectServer";
import AgentServer from "./(pages)/agent-connect/AgentServer";

export default function Home() {
  return (
    <div>
      <SearchBox />
      <br />
      <br/>
      <div className="container mx-auto  space-y-12">
        <FeaturedProjectsServer />
        <HighlightProjectsServer />
        <GetOwnerProperties />
        <AgentServer />
        <ExploreOurServices />
        {/* Apartments, villas and more  */}
        <div>
          <div className="headingSideBar">
            <h1 className="text-2xl font-bold">
              Explore Properties in hyderabad
            </h1>
            <p className="headingDesc">
              Find apartments, villas, farmhouses, and residential plots in top
              localities.
            </p>
          </div>
          <ExploreMorePropertiesPage />
        </div>

        <div>
          <TestomianalHome />
        </div>
      </div>
    </div>
  );
}
