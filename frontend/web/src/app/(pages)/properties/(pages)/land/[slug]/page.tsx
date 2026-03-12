import { getLandSlugProjects } from "@/data/serverData";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { notFound } from "next/navigation";
import { ILand } from "@/types/land";
import GalleryFile from "../../../GalleryFile";
import { GiCompass, GiRoad } from "react-icons/gi";
import { FaRoad } from "react-icons/fa";
import { BiShapeSquare } from "react-icons/bi";
import NearByPlaceClient from "@/app/(pages)/properties/(pages)/NearByPlaceClient";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import RelatedLandCarousel from "./RelatedLandCarousel";
import Image from "next/image";
import ad from "@/asserts/ad.png";
import { LAND_PLOT_AMENITIES } from "@/app/(pages)/postproperty/constants/amenities";
import {
  resolveListingSource,
} from "@/utilies/resolveListingSource";
import { FiGrid, FiHash, FiZap } from "react-icons/fi";
import { GiMoneyStack } from "react-icons/gi";
import { IoSparklesOutline, IoWaterOutline } from "react-icons/io5";
import { MdOutlineElectricBolt, MdOutlineLayers } from "react-icons/md";
import { RiSurveyLine } from "react-icons/ri";
import { TbMapSearch } from "react-icons/tb";
import { PiMapTrifold } from "react-icons/pi";
import { HiOutlineViewGrid } from "react-icons/hi";

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

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  let project: ILand | null;
  try {
    project = await getLandSlugProjects({ slug });
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
  const resolvedListingSource = resolveListingSource(
    project?.listingSource,
    project?.createdBy as any,
  );
  const detailsItems = [
    {
      label: "Negotiable",
      value: project?.negotiable ? "Yes" : "No",
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
    <div
      className="min-h-screen py-6 overflow-hidden"
    >
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

          <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
            <main className="flex-1">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">

                {/* Gallery */}
                <div className="w-full lg:w-[58%]">
                  <GalleryFile
                    gallery={project?.gallery}
                    title={project?.title}
                    propertyId={project?._id}
                    propertyType="Land"
                  />
                </div>
                <div className="flex flex-1 self-stretch min-h-0">
                  <div className="flex-1 p-4 sm:p-2 flex flex-col justify-between h-full gap-8">

                    {/* PART 1 */}
                    <div className="grid grid-cols-2 gap-8 pl-1">

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Plot Area
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.plotArea ?? "—"} sqft
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Price Per Sqft
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          ₹ {project?.pricePerSqft}/sqft
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Sale Type
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900 capitalize">
                          {project?.listingType ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Availability Status
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.readyToConstruct ? "Ready to Construct" : "Under Construction"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Layout type
                        </span>
                        <span className="capitalize text-sm sm:text-base font-semibold text-gray-900">
                          {project?.layoutType ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Fencing
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.fencing ? "Available" : "Unavailable"}
                        </span>
                      </div>

                    </div>

                    {/* ICON STATS */}
                    <div
                      className="grid grid-cols-3 border border-gray-200 rounded-md overflow-hidden shadow-sm"
                      style={{ background: bgcolor }}
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4">
                        <GiCompass color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.facing ?? "—"}</span>
                        <span className="text-xs sm:text-sm text-gray-500">Facing</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 border-x border-gray-200">
                        <FaRoad color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.roadWidthFt ?? "—"} ft</span>
                        <span className="text-xs sm:text-sm text-gray-500">Road Width</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4">
                        <IoSparklesOutline  color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.amenities?.length ?? 0}</span>
                        <span className="text-xs sm:text-sm text-gray-500">Amenities</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <br />

              <div className="w-full">
                <div className="grid gap-4">
                  <section className="space-y-4">
                    <section className="rounded-lg p-6 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-6 text-xl font-semibold text-gray-900">
                        More Details
                      </h2>

                      <div className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        {detailsItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.label}
                              className="grid grid-cols-[32px_1fr] grid-rows-2 gap-x-3 items-center"
                            >
                              <div className="row-span-2 flex items-center justify-center text-gray-500">
                                <Icon size={25} />
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.label}
                              </p>
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

                      <div className="mt-8">
                        <ContactOwnerButton
                          listingType={project.listingType}
                          projectId={project._id}
                          propertyType="landplots"
                          listingSource={resolvedListingSource}
                          ownerName={project?.createdBy?.name}
                          ownerPhone={project?.createdBy?.contact ?? (project as any)?.phone}
                          ownerEmail={project?.createdBy?.email}
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
                          {project.amenities.map((i: any, index) => (
                            (() => {
                              const icon =
                                amenityIconByKey.get(i.key) ??
                                amenityIconByTitle.get(i.title);

                              return (
                                <div
                                  key={i.key ?? `${i.title}-${index}`}
                                  className="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1"
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
                        <NearByPlaceClient
                          projectLocation={project.location}
                          projectName={project.title ?? "Property Location"}
                          nearbyPlaces={project.nearbyPlaces ?? []}
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
            <aside className="w-full shrink-0 lg:w-[260px] sticky top-20 self-start">
              <Image
                src={ad}
                alt="advertisement banner"
                className="w-full h-auto p-6"
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
