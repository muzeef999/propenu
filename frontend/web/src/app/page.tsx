
import HeroBannerSVG from "@/svg/HeroBannerSVG";
import TestomianalHome from "./(pages)/reviews/TestomianalHome";
import ExploreMorePropertiesPage from "./(pages)/explore-properties/Explore-properties";
import SearchBox from "@/components/SearchBox";
import FeaturedProjectsServer from "./(pages)/featured/FeaturedProjectsServer";
import PopularOwnerPropertiesClient from "./(pages)/owner-listed/PopularOwnerPropertiesClient";
import GetOwnerProperties from "./(pages)/owner-listed/PopularOwnerPropertiesServer";

export default function Home() {
  return (
    <div className="container mx-auto p-4 space-y-12">
      {/* heroBanner */}

      <SearchBox />
      <div className="w-full">
        <HeroBannerSVG />
      </div>

      {/* Feature projects */}
      <div>
        <FeaturedProjectsServer />
      </div>

      {/* popular owner Properties */}
      <div>
        <GetOwnerProperties />
      </div>

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

      <div>
        <h1>Hello</h1>
      </div>
    </div>
  );
}
