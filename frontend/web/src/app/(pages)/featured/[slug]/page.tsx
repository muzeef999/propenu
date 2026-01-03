import { notFound } from "next/navigation";
import { getFeaturedSlugProjects } from "@/data/serverData";
import { FeaturedProject } from "@/types";
import Image from "next/image";
import MicroSiteNavbar from "./MicroSiteNavbar";
import Herosection from "./Herosection";
import AvailableProperties from "./AvailableProperties";
import Amenities from "./Amenities";
import LocateUs from "./LocateUs";
import Gallery from "./Gallery";
import AboutUS from "./AboutUs";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  let project: FeaturedProject | null;
  try {
    project = await getFeaturedSlugProjects({ slug });
  } catch (err) {
    console.error("Error fetching project:", err);
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p>Unable to load project. Try again later.</p>
      </main>
    );
  }

  if (!project) {
    notFound();
  }

  const links = [
    { title: "Available Properties", href: "#available-properties" },
    { title: "Amenities", href: "#amenities" },
    { title: "Map View", href: "#map-view" },
    { title: "Gallery", href: "#gallery" },
    { title: "About Us", href: "#about-us" },
    { title: "Brochure", href: "#brochure" },
  ];

  const hero = {
    projectId: project._id,
    subTagline: project?.heroSubTagline,
    description: project?.heroDescription,
    propertyType: project?.propertyType || "residential",
    color: project?.color?.trim(),
    heroImage: project.heroImage,
    stats: [
      { value: "₹1,2Cr+", label: "Starting Price" },
      { value: "3-4 BHK", label: "Configurations" },
      { value: "50+", label: "Amenities" },
      { value: "RERA", label: "Approved" },
    ],
    ctaPrimary: { text: "Explore", href: "/explore" },
    ctaSecondary: { text: "More", href: "/more" },
  };

  const bhkSummary = {
    bhkSummary: project?.bhkSummary,
    color: project?.color?.trim(),
  };

  const amenities = {
    amenities: project?.amenities,
    color: project?.color?.trim(),
  };

  const nearbyPlaces = {
    location: project?.location,
    nearbyPlaces: project?.nearbyPlaces,
    color: project?.color?.trim(),
  };

  const gallerySummary = {
    gallerySummary: project?.gallerySummary,
    color: project?.color?.trim(),
  };

  const aboutSummary = {
    aboutSummary: project?.aboutSummary,
    color: project?.color?.trim(),
  };
  console.log(project);

  return (
    <div>
      <MicroSiteNavbar
        links={links}
        logoUrl={project?.logo?.url}
        color={project?.color?.trim()}
        brochureUrl={project?.brochureUrl}
      />

      <Herosection hero={hero} />

     <br/>
      <div className="container mx-auto px-4 space-y-2">

        <div id="available-properties" className="scroll-mt-20">
          <AvailableProperties bhk={bhkSummary} />
        </div>

        <div id="amenities" className="scroll-mt-20">
          <Amenities amenities={amenities} />
        </div>

        <div id="map-view" className="scroll-mt-20">
          <LocateUs nearbyPlaces={nearbyPlaces} />
        </div>

        <div id="gallery" className="scroll-mt-20">
          <Gallery gallerySummary={gallerySummary} />
        </div>

        <div id="about-us" className="scroll-mt-20">
          <AboutUS aboutSummary={aboutSummary} />
        </div>
      </div>
    </div>
  );
}
