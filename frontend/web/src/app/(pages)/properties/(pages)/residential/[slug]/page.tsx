import { getResidentialSlugProjects } from "@/data/serverData";
import { Property } from "@/types/property";
import { IResidential } from "@/types/residential";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { minDelay } from "@/utilies/minDelay";
import { notFound } from "next/navigation";
import Script from "next/script";
import GalleryFile from "../../../GalleryFile"; // Assuming this is client-side or handles SSR correctly
import { Balconies, Bath, Bhk } from "@/icons/icons";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import PropertyViewDurationTracker from "@/components/PropertyViewDurationTracker";
import PublicViewTracker from "@/components/tracking/PublicViewTracker";
import Image from "next/image";
import RelatedPropertiesCarousel from "./RelatedPropertiesCarousel";
import ResidentialNearbySection from "./ResidentialNearbySection";
import { RESIDENTIAL_AMENITIES } from "@/app/(pages)/postproperty/constants/amenities";
import SponsoreCard from "../../../cards/SponsoreCard";
import AdCard, { type Ad } from "../../../cards/AdCard";
import { buildPropertyMetadata } from "@/utilies/propertyOpenGraph";
import { listingSourceToOwnershipLabel } from "@/utilies/resolveListingSource";
import { buildListingStructuredData } from "@/utilies/structuredData";

import { GiKnifeFork, GiMoneyStack } from "react-icons/gi";
import { RiCarLine } from "react-icons/ri";
import { TilesIcons } from "../../MoreDetailsIcons";
import { HiOutlineUser } from "react-icons/hi2";
import { LuSquareParking } from "react-icons/lu";
import { PiCalendarBlank, PiCompass, PiMotorcycle } from "react-icons/pi";


type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const bgcolor = hexToRGBA("#27AE60", 0.08);
const amenityIconByKey = new Map(
  RESIDENTIAL_AMENITIES.map((amenity) => [amenity.key, amenity.icon]),
);
const amenityIconByTitle = new Map(
  RESIDENTIAL_AMENITIES.map((amenity) => [amenity.title, amenity.icon]),
);

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = await getResidentialSlugProjects({ slug }).catch(() => null);

  return buildPropertyMetadata({
    property: project,
    slug,
    propertyType: "residential",
    propertyTypeLabel: "Residential",
  });
}

function getPropertyLink(property: Property) {
  const type = (property.type || "").toLowerCase();
  const promotionType = String(property.promotion?.type || "").toLowerCase();

  switch (type) {
    case "residential":
      return `/properties/residential/${property.slug}`;
    case "commercial":
      return `/properties/commercial/${property.slug}`;
    case "land":
      return `/properties/landploat/${property.slug}`;
    case "agricultural":
      return `/properties/agricultural/${property.slug}`;
    case "featuredproject":
      return promotionType === "prime"
        ? `/prime/${property.slug}`
        : `/project/${property.slug}`;
    default:
      return "/";
  }
}

function getAdLocation(property: Property) {
  return [property.locality, property.city, (property as any).state]
    .filter(Boolean)
    .join(", ");
}

function getAdDisplayCategory(property: Property) {
  const type = String(property.type || "").toLowerCase();
  const projectCategory = (property as any).categoryType || (property as any).category;

  if (type === "featuredproject" && projectCategory) {
    return String(projectCategory);
  }

  return property.type || "";
}

function getAdPriceLabel(property: Property) {
  const priceFrom = Number(property.priceFrom);
  const priceTo = Number(property.priceTo);
  const price = Number(property.price);

  if (
    Number.isFinite(priceFrom) &&
    priceFrom > 0 &&
    Number.isFinite(priceTo) &&
    priceTo > 0 &&
    priceFrom !== priceTo
  ) {
    return `${formatINR(priceFrom)} - ${formatINR(priceTo)}`;
  }

  if (Number.isFinite(priceFrom) && priceFrom > 0) {
    return `From ${formatINR(priceFrom)}`;
  }

  if (Number.isFinite(priceTo) && priceTo > 0) {
    return `Up to ${formatINR(priceTo)}`;
  }

  if (Number.isFinite(price) && price > 0) {
    return formatINR(price);
  }

  return "Price on request";
}

function toTitleCase(value?: string) {
  if (!value) return "";

  return value.replace(/\b\w+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}

function getAdBuilderName(property: Property) {
  const createdBy = (property as any).createdBy;
  const developer = (property as any).developer;
  const aboutSummary = (property as any).aboutSummary;
  const aboutBuilderName = Array.isArray(aboutSummary)
    ? aboutSummary[0]?.builderName
    : aboutSummary?.builderName;
  const rawContactName =
    (typeof developer === "object" && developer !== null
      ? developer.companyName || developer.name || developer.fullName
      || (typeof createdBy === "object" && createdBy !== null
        ? createdBy.name
        : undefined)
      : typeof createdBy === "object" && createdBy !== null
        ? createdBy.name
        : undefined) ||
    aboutBuilderName ||
    (property as any).builderName ||
    (property as any).companyName;

  return toTitleCase(rawContactName);
}

async function getSponsoredSidebarAds(project: IResidential): Promise<Ad[]> {
  if (!apiUrl) return [];

  const query = new URLSearchParams();
  query.set("category", "Residential");

  if (project.listingType) query.set("listingType", project.listingType);
  if (project.city) query.set("city", project.city);
  if ((project as any).state) query.set("state", (project as any).state);
  if ((project as any).locality) query.set("locality", (project as any).locality);

  try {
    const res = await fetch(
      `${apiUrl}/api/properties/sponsored?${query.toString()}`,
      { next: { revalidate: 10 } },
    );

    if (!res.ok) return [];

    const json = await res.json();
    const properties = (json.data ?? []) as Property[];

    return properties
      .filter((property) => (property.id || property._id) !== project._id)
      .filter(
        (property) =>
          String(property.promotion?.type || "").toLowerCase() === "sponsored",
      )
      .slice(0, 10)
      .map((property) => ({
        id: property.id || property._id || "",
        title: property.title || "Featured Property",
        description: undefined,
        location: getAdLocation(property),
        priceLabel: getAdPriceLabel(property),
        builderName: getAdBuilderName(property),
        imageUrl:
          (property as any).heroImage ||
          property.gallery?.[0]?.url ||
          property.gallerySummary?.[0]?.url ||
          "/images/spronsoreCard.png",
        ctaText: "View Details",
        ctaLink: getPropertyLink(property),
        category: property.type || "Residential",
        displayCategory: getAdDisplayCategory(property),
        featured: property.promotion?.type === "featured",
        sponsored: true,
        promotionType: property.promotion?.type,
      }));
  } catch (err) {
    console.error("Error fetching sponsored properties:", err);
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  let project: IResidential | null;
  try {
    [project] = await Promise.all([
      getResidentialSlugProjects({ slug }),
      minDelay(1500),
    ]);
  } catch (err) {
    console.error("Error fetching project:", err);
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p>Unable to load project. Try again later.</p>
      </main>
    );
  }
  const maskEmail = (email?: string) => {
    if (!email) return "";

    const [username, domain] = email.split("@");

    if (!username || !domain) return email;

    const visibleChars = username.slice(0, 2);
    return `${visibleChars}***@${domain}`;
  };

  if (!project) {
    notFound();
  }
  const sidebarAds = await getSponsoredSidebarAds(project);
  const priceLabel = formatINR(project.price);
  const nearbyLandmarks = (project.nearbyPlaces ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER),
    );
  const detailsItems = [
    {
      label: "Listing Source",
      value: project?.listingSource,
      icon: HiOutlineUser,
    },
    {
      label: "Negotiable",
      value: project?.isPriceNegotiable ? "Yes" : "No",
      icon: GiMoneyStack,
    },
    {
      label: "Parking Type",
      value: ((project as any)?.parkingType ?? "N/A").toString(),
      icon: LuSquareParking,
    },
    {
      label: "2W Parking",
      value: ((project as any)?.parkingDetails?.twoWheeler ?? 0).toString(),
      icon: PiMotorcycle,
    },
    {
      label: "4W Parking",
      value: ((project as any)?.parkingDetails?.fourWheeler ?? 0).toString(),
      icon: RiCarLine,
    },
    {
      label: "Facing",
      value: (project?.facing ?? "N/A").toString(),
      icon: PiCompass,
    },
    {
      label: "Floor Type",
      value: ((project as any)?.flooringType ?? "N/A").toString(),
      icon: TilesIcons,
    },
    {
      label: "Kitchen Type",
      value: ((project as any)?.kitchenType ?? "N/A").toString(),
      icon: GiKnifeFork,
    },
    {
      label: "Age of Property",
      value: (project as any)?.builtYear
        ? `${Math.max(new Date().getFullYear() - (project as any).builtYear, 0)} Year`
        : "0-1 Year",
      icon: PiCalendarBlank,
    },
  ];
  const structuredData = buildListingStructuredData(
    {
      title: project.title || "Residential Property",
      description: project.description,
      path: `/properties/residential/${project.slug || slug}`,
      image: project.gallery?.[0]?.url || (project as any).gallerySummary?.[0]?.url,
      category: "Residential Property",
      price: project.price,
      currency: "INR",
      address: project.address,
      city: project.city,
      state: (project as any).state,
      locality: (project as any).locality,
      publishedAt: (project as any).createdAt,
      updatedAt: (project as any).updatedAt,
      sellerName: (project as any)?.createdBy?.name,
    },
    "Residential Properties",
    "/properties/residential",
  );

  return (
    <>
      <Script
        id="residential-listing-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen py-6 overflow-hidden">
        <PublicViewTracker
          entityType="property"
          entityId={String(project._id)}
          propertyType="residential"
        />
        <PropertyViewDurationTracker
          projectId={String(project._id)}
          propertyType="residentials"
        />
        <div className="container">
        <div className="w-full">
          {/* Top: Price + Title + CTA */}
          <header className="flex flex-col justify-between gap-2 p-2">
            <div className="text-lg sm:text-2xl md:text-2xl font-semibold leading-snug">
              <span className="text-primary whitespace-nowrap align-top">
                {priceLabel}
              </span>
              <span className="ml-2 text-gray-900 font-medium">
                {project.title}
              </span>
            </div>
          </header>

          <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:items-stretch">
            <main className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-stretch">
                {/* Gallery */}
                <div className="min-w-0 w-full lg:w-[58%]">
                  <GalleryFile
                    gallery={project?.gallery}
                    title={project?.title}
                    propertyId={project?._id}
                    propertyType="Residential"
                  />
                </div>
                <div className="flex min-w-0 flex-1 self-stretch min-h-0">
                  <div className="flex h-full min-w-0 flex-1 flex-col justify-between gap-8 p-4 sm:p-2">

                    {/* PART 1 */}
                    <div className="grid grid-cols-2 gap-8 pl-1">

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Price per sqft
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          ₹ {project?.pricePerSqft}/sqft
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Carpet Area
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.carpetArea ?? "—"} sqft
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Sale Type
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900 capitalize">
                          {project?.transactionType ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Availability Status
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900 capitalize">
                          {project?.constructionStatus ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Furnishing Status
                        </span>
                        <span className="capitalize text-sm sm:text-base font-semibold text-gray-900">
                          {project?.furnishing ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Floors
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.floorNumber === 0
                            ? "G"
                            : (project?.floorNumber ?? "—")}
                          /{project?.totalFloors ?? "—"}
                        </span>
                      </div>

                      {/* <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Project Total Area
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.projectArea ? `${project.projectArea} Acre` : "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          No. of Towers
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.totalTowers ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Total Units
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.totalUnits ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Available Units
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.availableUnits ?? "—"}
                        </span>
                      </div> */}

                    </div>

                    {/* ICON STATS */}
                    <div
                      className="grid grid-cols-3 border border-gray-200 rounded-md overflow-hidden shadow-sm"
                      style={{ background: bgcolor }}
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4">
                        <Bhk color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.bedrooms}</span>
                        <span className="text-xs sm:text-sm text-gray-500">Bedrooms</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 border-x border-gray-200">
                        <Bath color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.bathrooms}</span>
                        <span className="text-xs sm:text-sm text-gray-500">Bathrooms</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4">
                        <Balconies color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.balconies}</span>
                        <span className="text-xs sm:text-sm text-gray-500">Balconies</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <br />

              <div className="min-w-0 w-full">
                <div className="grid gap-4">
                  <section className="min-w-0 space-y-4">
                    <section className="rounded-lg p-6 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-6 text-xl font-semibold text-gray-900">
                        More Details
                      </h2>

                      {/* Two columns on mobile, four columns on wide screens */}
                      <div className="grid grid-cols-2 gap-4 text-sm xl:grid-cols-4">
                        {detailsItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.label}
                              className="grid grid-cols-[32px_1fr] grid-rows-2 gap-x-3 items-center capitalize"
                            >
                              {/* Icon (center between label and value) */}
                              <div className="row-span-2 flex items-center justify-center text-gray-500">
                                <Icon size={25} />
                              </div>

                              {/* Label */}
                              <p className="text-sm font-medium text-gray-900">
                                {item.label}
                              </p>

                              {/* Value */}
                              <p className="text-gray-500 wrap-break-word">
                                {item.value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {/* ADDRESS */}
                      <div className="mt-8">
                        <p className="font-medium text-gray-900">Address</p>
                        <p className="text-gray-500 mt-1 leading-relaxed">
                          {project.address}
                        </p>
                      </div>

                      {/* DESCRIPTION */}
                      <div className="mt-6">
                        <p className="font-medium text-gray-900">
                          Description:
                        </p>
                        <p className="text-gray-500 mt-1 leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                      {(project as any)?.createdBy?.name && (
                        <div className="mt-6 inline-flex w-fit items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-2.5 shadow-2xs">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-2xs">
                            {(project as any)?.createdBy?.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
                            <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                              Listed By {listingSourceToOwnershipLabel(project?.listingSource, (project as any)?.createdBy)}:
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {(project as any)?.createdBy?.name}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-8">
                        <ContactOwnerButton
                          listingType={project.listingType}
                          projectId={project._id}
                          propertyType="residentials"
                          listingSource={project.listingSource}
                          createdBy={(project as any)?.createdBy}
                          ownerName={(project as any)?.createdBy?.name}
                          ownerPhone={(project as any)?.createdBy?.phone}
                          ownerEmail={(project as any)?.createdBy?.email ?? (project as any)?.email}
                          postedOn={(project as any)?.createdAt}
                          price={project?.price}
                          propertyLabel={project?.title}
                        />
                      </div>
                    </section>

                    {/* Amenities */}
                    <section className="rounded-lg p-4 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-3 text-xl font-semibold text-gray-900">
                        Amenities
                      </h2>
                      {project.amenities && project.amenities.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 sm:grid-cols-3">
                          {project.amenities.map((i, index) => (
                            (() => {
                              const icon =
                                amenityIconByKey.get(i.key) ??
                                amenityIconByTitle.get(i.title);

                              return (
                                <div
                                  key={i.key ?? `${i.title}-${index}`}
                                  className="flex items-center gap-1.5 rounded-md border border-gray-100 px-1.5 py-0.5"
                                >
                                  {typeof icon === "string" ? (
                                    <Image
                                      src={icon.trim()}
                                      alt={`${i.title} icon`}
                                      width={14}
                                      height={14}
                                      className="h-4 w-4 opacity-75"
                                    />
                                  ) : icon ? (
                                    <span className="text-gray-600 [&>svg]:h-3.5 [&>svg]:w-3.5">
                                      {icon}
                                    </span>
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  )}
                                  <span className="text-xs">{i.title}</span>
                                </div>
                              );
                            })()
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Amenities information not available.
                        </p>
                      )}
                    </section>

                    <section className="rounded-lg p-4 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-3 text-xl font-semibold text-gray-900">
                        Popular Landmarks Nearby
                      </h2>

                      {project.location ? (
                        <ResidentialNearbySection
                          projectLocation={project.location}
                          projectName={project.title ?? "Property Location"}
                          nearbyLandmarks={nearbyLandmarks}
                        />
                      ) : (
                        <p className="text-sm text-gray-500">
                          Location information not available.
                        </p>
                      )}
                    </section>

                    <section className="rounded-lg p-4 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">
                        More Similar Properties for you
                      </h2>

                      {project.relatedProjects &&
                        project.relatedProjects.length > 0 ? (
                        <RelatedPropertiesCarousel projects={project.relatedProjects} />
                      ) : (
                        <p className="text-sm text-gray-500">
                          No similar properties available.
                        </p>
                      )}
                    </section>
                  </section>
                </div>
              </div>
            </main>
            <aside className="w-full shrink-0 lg:w-[260px] sticky top-20 self-start">
              <div className="flex flex-col gap-6">
                {sidebarAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
                {sidebarAds.length === 0 && <SponsoreCard />}
              </div>
            </aside>
          </div>
        </div>
        </div >
      </div >
    </>
  );
};
