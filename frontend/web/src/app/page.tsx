import FeaturedProjects from "@/app/(pages)/featured/FeaturedProjects";
import HeroBannerSVG from "@/svg/HeroBannerSVG";
import GetOwnerProperties from "./(pages)/owner-listed/PopularOwnerProperties";
import TestomianalHome from "./(pages)/reviews/TestomianalHome";
import Link from "next/link";
import { RiArrowRightSLine } from "react-icons/ri";
import ExploreMorePropertiesPage from "./(pages)/explore-properties/Explore-properties";
import SearchBox from "@/components/SearchBox";

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
      <div className="flex justify-between items-center">
        <div className="headingSideBar">
      <h1 className="text-2xl font-bold">Feature Projects</h1>
      <p className="headingDesc">Building excellence in Hyderabad</p> 
        </div>
         <Link href="/featured" className="flex items-center gap-1 text-green-600 hover:text-green-700">
           View All
          <RiArrowRightSLine size={18} />
         </Link>
       </div> 
      <FeaturedProjects />
      </div>


      {/* popular owner Properties */}
       <div>
         <div className="flex justify-between items-center">
      <div className="headingSideBar">
      <h1 className="text-2xl font-bold">Popular Owner Properties</h1>
      <p className="headingDesc">Building excellence in Hyderabad</p>
       </div> 
       <Link href="/featured" className="flex items-center gap-1 text-green-600 hover:text-green-700">
           View All
          <RiArrowRightSLine size={18} />
         </Link>
         </div>
         <br/>
      <GetOwnerProperties />
      </div>

      {/* Apartments, villas and more  */}
       <div>   
      <div className="headingSideBar">
      <h1 className="text-2xl font-bold">Explore Properties in hyderabad</h1>
      <p className="headingDesc">Find apartments, villas, farmhouses, and residential plots in top localities.</p>
       </div> 
      <ExploreMorePropertiesPage />
      </div>

  

   <div><TestomianalHome/></div>  
   
        <div>
           <h1>Hello</h1>
          </div>
   </div>
  );
}
