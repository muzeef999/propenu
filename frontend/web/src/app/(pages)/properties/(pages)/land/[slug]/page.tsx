import { getLandSlugProjects } from "@/data/serverData";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { minDelay } from "@/utilies/minDelay";
import { notFound } from "next/navigation";
import { ILand } from "@/types/land";
import GalleryFile from "../../../GalleryFile";
import { GiCompass, GiRoad, GiMoneyStack } from "react-icons/gi";
import { FaRoad } from "react-icons/fa";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import PropertyViewDurationTracker from "@/components/PropertyViewDurationTracker";
import RelatedLandCarousel from "./RelatedLandCarousel";
import Image from "next/image";
import LandNearbySection from "./LandNearbySection";
import { LAND_PLOT_AMENITIES } from "@/app/(pages)/postproperty/constants/amenities";
import SponsoreCard from "../../../cards/SponsoreCard";
import { resolveListingSource, listingSourceToOwnershipLabel } from "@/utilies/resolveListingSource";
import { FiZap } from "react-icons/fi";
import { IoSparklesOutline, IoWaterOutline } from "react-icons/io5";
import { MdOutlineLayers } from "react-icons/md";
import { PiMapTrifold } from "react-icons/pi";
import { buildPropertyMetadata } from "@/utilies/propertyOpenGraph";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

const bgcolor = hexToRGBA("#27AE60", 0.08);
const amenityIconByKey = new Map(
  LAND_PLOT_AMENITIES.map((amenity) => [amenity.key, amenity.icon]),
);
const amenityIconByTitle = new Map(
  LAND_PLOT_AMENITIES.map((amenity) => [amenity.title, amenity.icon]),
);

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = await getLandSlugProjects({ slug }).catch(() => null);

  return buildPropertyMetadata({
    property: project,
    slug,
    propertyType: "land",
    propertyTypeLabel: "Land",
  });
}

const SQFT_PER_LAND_UNIT: Record<string, number> = {
  sqft: 1,
  sqmt: 10.7639,
  sqyd: 9,
  acre: 43560,
  guntha: 1089,
  cent: 435.6,
  kanal: 5445,
  hectare: 107639,
};

function formatAreaUnit(unit?: string) {
  if (!unit) return "sqft";

  const normalized = unit.toLowerCase();
  return SQFT_PER_LAND_UNIT[normalized] ? normalized : "sqft";
}

function calculatePricePerPlotUnit(
  price?: number,
  area?: number | string,
  unit = "sqft",
  fallbackPricePerSqft?: number,
) {
  const numericPrice = Number(price);
  const numericArea = Number(area);

  if (numericPrice > 0 && numericArea > 0) {
    return Math.round(numericPrice / numericArea);
  }

  const numericFallback = Number(fallbackPricePerSqft);
  const sqftPerUnit = SQFT_PER_LAND_UNIT[unit] ?? 1;

  return numericFallback > 0 ? Math.round(numericFallback * sqftPerUnit) : 0;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  let project: ILand | null;
  try {
    [project] = await Promise.all([getLandSlugProjects({ slug }), minDelay(1500)]);
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

  const priceLabel = formatINR(project?.price);
  const plotAreaUnit = formatAreaUnit((project as any)?.plotAreaUnit);
  const pricePerArea = calculatePricePerPlotUnit(
    project?.price,
    project?.plotArea,
    plotAreaUnit,
    project?.pricePerSqft,
  );
  const resolvedListingSource = resolveListingSource(
    project?.listingSource,
    project?.createdBy as any,
  );
  const nearbyLandmarks = (project.nearbyPlaces ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER),
    );

  const detailsItems = [
    {
      label: "Negotiable",
      value: project?.isPriceNegotiable ? "Yes" : "No",
      icon: GiMoneyStack,
    },
    {
      label: "Survey Number",
      value: project?.surveyNumber ?? "N/A",
      icon: PiMapTrifold,
    },
    {
      label: "Land Use Zone",
      value: project?.landUseZone ?? "N/A",
      icon: MdOutlineLayers,
    },
    {
      label: "Road Width",
      value: project?.roadWidthFt ? `${project.roadWidthFt} ft` : "N/A",
      icon: GiRoad,
    },
    {
      label: "Water Connection",
      value: project?.waterConnection ? "Available" : "Unavailable",
      icon: IoWaterOutline,
    },
    {
      label: "Electricity Connection",
      value: project?.electricityConnection ? "Available" : "Unavailable",
      icon: FiZap,
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden py-6">
      <PropertyViewDurationTracker
        projectId={String(project._id)}
        propertyType="landplots"
      />
      <div className="container">
        <div className="w-full">
          <header className="flex flex-col justify-between gap-2 p-2">
            <div className="text-lg font-semibold leading-snug sm:text-2xl md:text-2xl">
              <span className="text-primary whitespace-nowrap align-top">
                {priceLabel}
              </span>
              <span className="ml-2 font-medium text-gray-900">{project.title}</span>
            </div>
          </header>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
            <main className="flex-1">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
                <div className="w-full lg:w-[58%]">
                  <GalleryFile
                    gallery={project?.gallery}
                    title={project?.title}
                    propertyId={project?._id}
                    propertyType="Land"
                  />
                </div>

                <div className="flex min-h-0 flex-1 self-stretch">
                  <div className="flex h-full flex-1 flex-col justify-between gap-8 p-4 sm:p-2">
                    <div className="grid grid-cols-2 gap-8 pl-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 sm:text-sm">
                          Plot Area
                        </span>
                        <span className="text-sm font-semibold text-gray-900 sm:text-base">
                          {project?.plotArea ?? "—"} {plotAreaUnit}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 sm:text-sm">
                          Price Per {plotAreaUnit}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 sm:text-base">
                          ₹ {pricePerArea ? pricePerArea.toLocaleString("en-IN") : "—"}/{plotAreaUnit}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 sm:text-sm">
                          Sale Type
                        </span>
                        <span className="text-sm font-semibold capitalize text-gray-900 sm:text-base">
                          {project?.listingType ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 sm:text-sm">
                          Availability Status
                        </span>
                        <span className="text-sm font-semibold text-gray-900 sm:text-base">
                          {project?.readyToConstruct
                            ? "Ready to Construct"
                            : "Under Construction"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 sm:text-sm">
                          Layout type
                        </span>
                        <span className="text-sm font-semibold capitalize text-gray-900 sm:text-base">
                          {project?.layoutType ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-500 sm:text-sm">
                          Fencing
                        </span>
                        <span className="text-sm font-semibold text-gray-900 sm:text-base">
                          {project?.fencing ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-3 overflow-hidden rounded-md border border-gray-200 shadow-sm"
                      style={{ background: bgcolor }}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 py-3 sm:flex-row sm:gap-2 sm:py-4">
                        <GiCompass color="#6B7280" />
                        <span className="text-sm font-semibold text-gray-900 sm:text-base">
                          {project?.facing ?? "—"}
                        </span>
                        <span className="text-xs text-gray-500 sm:text-sm">Facing</span>
                      </div>

                      <div className="flex flex-col items-center justify-center gap-1 border-x border-gray-200 py-3 sm:flex-row sm:gap-2 sm:py-4">
                        <FaRoad color="#6B7280" />
                        <span className="text-sm font-semibold text-gray-900 sm:text-base">
                          {project?.roadWidthFt ?? "—"} ft
                        </span>
                        <span className="text-xs text-gray-500 sm:text-sm">Road Width</span>
                      </div>

                      <div className="flex flex-col items-center justify-center gap-1 py-3 sm:flex-row sm:gap-2 sm:py-4">
                        <IoSparklesOutline color="#6B7280" />
                        <span className="text-sm font-semibold text-gray-900 sm:text-base">
                          {project?.amenities?.length ?? 0}
                        </span>
                        <span className="text-xs text-gray-500 sm:text-sm">Amenities</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <br />

              <div className="min-w-0 w-full">
                <div className="grid gap-4">
                  <section className="min-w-0 space-y-4">
                    <section className="rounded-lg bg-[#f7f9fa] p-6 shadow-sm">
                      <h2 className="mb-6 text-xl font-semibold text-gray-900">
                        More Details
                      </h2>

                      <div className="grid grid-cols-2 gap-4 text-sm xl:grid-cols-4">
                        {detailsItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.label}
                              className="grid grid-cols-[32px_1fr] grid-rows-2 items-center gap-x-3"
                            >
                              <div className="row-span-2 flex items-center justify-center text-gray-500">
                                <Icon size={25} />
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.label}
                              </p>
                              <p className="wrap-break-word text-gray-500">{item.value}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-8">
                        <p className="font-medium text-gray-900">Address</p>
                        <p className="mt-1 leading-relaxed text-gray-500">
                          {project.address}
                        </p>
                      </div>

                      <div className="mt-6">
                        <p className="font-medium text-gray-900">Description:</p>
                        <p className="mt-1 leading-relaxed text-gray-500">
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
                          propertyType="landplots"
                          listingSource={resolvedListingSource}
                          ownerName={project?.createdBy?.name}
                          ownerPhone={
                            project?.createdBy?.contact ?? (project as any)?.phone
                          }
                          ownerEmail={project?.createdBy?.email}
                          postedOn={(project as any)?.createdAt}
                          price={project?.price}
                          propertyLabel={project?.title}
                        />
                      </div>
                    </section>

                    <section className="rounded-lg bg-[#f7f9fa] p-4 shadow-sm">
                      <h2 className="mb-3 text-xl font-semibold text-gray-900">
                        Amenities
                      </h2>
                      {project.amenities && project.amenities.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 sm:grid-cols-3">
                          {project.amenities.map((i: any, index) =>
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
                                      className="h-3.5 w-3.5 opacity-75"
                                    />
                                  ) : icon ? (
                                    <span className="text-gray-600 [&>svg]:h-3.5 [&>svg]:w-3.5">
                                      {icon}
                                    </span>
                                  ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  )}
                                  <span>{i.title}</span>
                                </div>
                              );
                            })(),
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Amenities information not available.
                        </p>
                      )}
                    </section>

                    <section className="rounded-lg bg-[#f7f9fa] p-4 shadow-sm">
                      <h2 className="mb-3 text-xl font-semibold text-gray-900">
                        Popular Landmarks Nearby
                      </h2>

                      {project.location ? (
                        <LandNearbySection
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

                    <section className="rounded-lg bg-[#f7f9fa] p-4 shadow-sm">
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">
                        More Similar Properties for you
                      </h2>

                      {project.relatedProjects && project.relatedProjects.length > 0 ? (
                        <RelatedLandCarousel projects={project.relatedProjects} />
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

            <aside className="sticky top-20 w-full shrink-0 self-start lg:w-[260px]">
              <SponsoreCard />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}



