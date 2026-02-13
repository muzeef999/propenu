export const dynamic = "force-dynamic";

import TestomianalHome from "./(pages)/reviews/TestomianalHome";
import ExploreMorePropertiesPage from "./(pages)/explore-properties/Explore-properties";
import SearchBox from "@/components/SearchBox";
import ExploreOurServices from "@/app/(pages)/explore-properties/ExploreOurServices";
import FeaturedProjectsClient from "./(pages)/featured/FeaturedProjectsClient";
import HighlightProjectsClient from "./(pages)/highlight-projects/HighlightProjectsClient";
import AgentsList from "./(pages)/agent-connect/AgentCard";
import PopularOwnerPropertiesClient from "./(pages)/owner-listed/PopularOwnerPropertiesClient";
import Banner from "@/components/Banner";

export default function Home() {
  return (
    <div>
      <Banner />
      <br />
      <br />
      <div className="container mx-auto  space-y-10">
        <FeaturedProjectsClient />
        <HighlightProjectsClient />
        <PopularOwnerPropertiesClient />
        <AgentsList />
        <ExploreOurServices />
        <ExploreMorePropertiesPage />
        <TestomianalHome />
      </div>
    </div>
  );
}
