import { getAgriculturalSlugProjects } from "@/data/serverData";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { minDelay } from "@/utilies/minDelay";
import { notFound } from "next/navigation";
import GalleryFile from "../../../GalleryFile";
import { MdWaterDrop } from "react-icons/md";
import { GiGroundSprout } from "react-icons/gi";
import { FaRoad } from "react-icons/fa";
import { IAgricultural } from "@/types/agricultural";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import RelatedAgriculturalCarousel from "./RelatedAgriculturalCarousel";
import Image from "next/image";
import { AGRICULTURAL_AMENITIES } from "@/app/(pages)/postproperty/constants/amenities";
import AgriculturalNearbySection from "./AgriculturalNearbySection";
import SponsoreCard from "../../../cards/SponsoreCard";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

const bgcolor = hexToRGBA("#27AE60", 0.08);
const amenityIconByKey = new Map(
  AGRICULTURAL_AMENITIES.map((amenity) => [amenity.key, amenity.icon]),
);
const amenityIconByTitle = new Map(
  AGRICULTURAL_AMENITIES.map((amenity) => [amenity.title, amenity.icon]),
);

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  let project: IAgricultural | null;
  try {
    [project] = await Promise.all([
      getAgriculturalSlugProjects({ slug }),
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

  if (!project || !project._id) {
    notFound();
  }
  const priceLabel = formatINR(project?.price);
  const nearbyLandmarks = (project.nearbyPlaces ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER),
    );

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

                <div className="w-full lg:w-[58%]">
                  <GalleryFile
                    gallery={project?.gallery}
                    title={project?.title}
                    propertyId={project?._id}
                    propertyType="Agricultural"
                  />
                </div>
                <div className="flex flex-1 self-stretch min-h-0">
                  <div className="flex-1 p-4 sm:p-2 flex flex-col justify-between h-full gap-8">

                    {/* PART 1 */}
                    <div className="grid grid-cols-2 gap-8 pl-1">

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Total Area
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.totalArea?.value} {project?.totalArea?.unit}
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
                          Listed Type
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-orange-600">
                          {project?.listingType ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Boundary Wall
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.boundaryWall ? "Available" : "Not Available"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Irrigation Type
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.irrigationType ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Land Shape
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.landShape ?? "—"}
                        </span>
                      </div>

                    </div>

                    {/* ICON STATS */}
                    <div
                      className="grid grid-cols-3 border border-gray-200 rounded-md overflow-hidden shadow-sm"
                      style={{ background: bgcolor }}
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4">
                        <MdWaterDrop color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.numberOfBorewells ?? 0}</span>
                        <span className="text-xs sm:text-sm text-gray-500">Borewells</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 border-x border-gray-200">
                        <GiGroundSprout color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.soilType ?? "—"}</span>
                        <span className="text-xs sm:text-sm text-gray-500">Soil Type</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4">
                        <FaRoad color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{project?.roadWidth?.value ?? "—"} {project?.roadWidth?.unit ?? ""}</span>
                        <span className="text-xs sm:text-sm text-gray-500">Road Width</span>
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

                      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            Price Breakup
                          </p>
                          <p className="text-gray-500">₹{project?.price}</p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            Property Ownership
                          </p>
                          <p className="text-gray-500">
                            {project?.listingSource}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            Electricity
                          </p>
                          <p className="text-gray-500">
                            {project?.electricityConnection ? "Available" : "Not Available"}
                          </p>
                        </div>

                        <div className="hidden md:block"></div>
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
                          propertyType="agriculturals"
                          listingSource={project.listingSource}
                          ownerName={project?.createdBy?.name}
                          ownerPhone={(project as any)?.createdBy?.contact ?? (project as any)?.phone}
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
                        <AgriculturalNearbySection
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
                        <RelatedAgriculturalCarousel
                          projects={project.relatedProjects}
                        />
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
              <SponsoreCard />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
