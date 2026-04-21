import { notFound } from "next/navigation";
import { getFeaturedSlugProjects } from "@/data/serverData";
import { FeaturedProject } from "@/types";
import MicroSiteNavbar from "./MicroSiteNavbar";
import Herosection from "./Herosection";
import AvailableProperties from "./AvailableProperties";
import Amenities from "./Amenities";
import LocateUs from "./LocateUs";
import Gallery from "./Gallery";
import AboutUS from "./AboutUs";
import Specification from "./Specification";
import { getProjectConfigurationValue } from "@/utilies/projectConfiguration";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const project = await getFeaturedSlugProjects({ slug });

  if (!project) {
    return {
      title: "Project Not Found",
      description: "Project not found",
    };
  }

  return {
    title: project.metaTitle,
    description: project.metaDescription,
    keywords: project.metaKeywords
  };
}


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
  ];
  function formatCompactPrice(price?: number) {
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return null;
    }

    if (price >= 1e7) {
      return `${(price / 1e7).toFixed(2).replace(/\.00$/, "")} Cr`;
    }

    if (price >= 1e5) {
      return `${(price / 1e5).toFixed(2).replace(/\.00$/, "")} L`;
    }

    return price.toLocaleString("en-IN");
  }

  function formatCrRange(priceFrom?: number, priceTo?: number) {
    const fromLabel = formatCompactPrice(priceFrom);
    const toLabel = formatCompactPrice(priceTo);

    if (fromLabel && toLabel) {
      if (priceFrom === priceTo) return fromLabel;
      return `${fromLabel} - ${toLabel}`;
    }

    if (fromLabel) return `From ${fromLabel}`;
    if (toLabel) return `Up to ${toLabel}`;

    return "Price on Request";
  }

  const startingPrice = formatCrRange(
    project?.priceFrom,
    project?.priceTo
  );
  const configurationValue = getProjectConfigurationValue(project);
  const hero = {
    projectId: project._id,
    subTagline: project?.heroSubTagline,
    heroTagline: project?.heroTagline,
    description: project?.heroDescription,
    propertyType: project?.propertyType || "residential",
    color: project?.color?.trim(),
    heroImage: project.heroImage,
    stats: [
      { value: startingPrice, label: "Price Range" },
      { value: configurationValue, label: "Configurations" },
      { value: (project?.amenities?.length || 0).toString(), label: "Amenities" },
      { value: "RERA", label: "Approved" },
    ],
    ctaPrimary: { text: "Explore", href: "/explore" },
    ctaSecondary: { text: "More", href: "/more" },
  };

  const bhkSummary = {
    bhkSummary: project?.bhkSummary,
    color: project?.color?.trim(),
    reraNumber: project?.reraNumber,
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
    youtubeVideos: project?.youtubeVideos,
  };

  const aboutSummary = {
    aboutSummary: project?.aboutSummary,
    color: project?.color?.trim(),
  };

  const  specifications =  {
    specifications: project?.specifications,
    color: project?.color?.trim(),
  }
 
  return (
    <div>
      <MicroSiteNavbar
        links={links}
        logoUrl={project?.logo?.url}
        color={project?.color?.trim()}
        brochureUrl={project?.brochure?.url}
        redirectUrl={project?.redirectUrl}
      />
      <Herosection hero={hero} />
      <br />
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

        <div id="specification" className="scroll-mt-20">
          <Specification specifications={specifications} />
        </div>

        <div id="about-us" className="scroll-mt-20">
          <AboutUS aboutSummary={aboutSummary} />
        </div>
      </div>
    </div>
  );
}
