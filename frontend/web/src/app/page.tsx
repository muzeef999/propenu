import FeaturedProjects from "@/app/(pages)/featured/FeaturedProjects";
import HeroBannerSVG from "@/svg/HeroBannerSVG";
import GetOwnerProperties from "./(pages)/owner-listed/PopularOwnerProperties";

export default function Home() {
  return (
   <div className="container mx-auto p-4 space-y-12">      
      {/* heroBanner */}
      <div className="w-full">
        <HeroBannerSVG />
      </div>

      {/* Feature projects */}
      <div>   
      <div className="headingSideBar">
      <h1 className="text-2xl font-bold">Feature Projects</h1>
      <p className="headingDesc">Building excellence in Hyderabad</p>
       </div> 
      <FeaturedProjects />
      </div>

      {/* popular owner Properties */}
       <div>
      <div className="headingSideBar">
      <h1 className="text-2xl font-bold">Popular Owner Properties</h1>
      <p className="headingDesc">Building excellence in Hyderabad</p>
       </div> 
      <GetOwnerProperties />
      </div>

      {/* Apartments, villas and more  */}
       <div>   
      <div className="headingSideBar">
      <h1 className="text-2xl font-bold">Apartments, Villas and more</h1>
      <p className="headingDesc">Building excellence in Hyderabad</p>
       </div> 
      <FeaturedProjects />
      </div>

      {/* Top projects */}
       <div>   
      <div className="headingSideBar">
      <h1 className="text-2xl font-bold">Top Projects</h1>
      <p className="headingDesc">Building excellence in Hyderabad</p>
       </div> 
      <FeaturedProjects />
      </div>
     
   
        <div>
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
          </div>
   </div>
  );
}
