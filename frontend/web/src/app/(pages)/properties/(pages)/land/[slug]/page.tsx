import { getLandSlugProjects } from "@/data/serverData";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { notFound } from "next/navigation";
import { ILand } from "@/types/land";
import GalleryFile from "../../../GalleryFile";
import { GiCompass } from "react-icons/gi";
import { FaRoad } from "react-icons/fa";
import { BiShapeSquare } from "react-icons/bi";
import NearByPlace from "@/app/(pages)/properties/(pages)/NearByPlace";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import RelatedLandCarousel from "./RelatedLandCarousel";
import Image from "next/image";
import { LAND_PLOT_AMENITIES } from "@/app/(pages)/postproperty/constants/amenities";
import {
  listingSourceToOwnershipLabel,
  resolveListingSource,
} from "@/utilies/resolveListingSource";
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
  const ownershipLabel = listingSourceToOwnershipLabel(
    project?.listingSource,
    project?.createdBy as any,
  );

  return (
    <div style={{ background: bgcolor }} className="min-h-screen py-6 overflow-hidden">
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

          <div className="flex flex-col gap-8 lg:flex-row">
            <main className="flex-1">
              <div className="flex flex-col lg:flex-row gap-2">

                {/* Gallery */}
                <div className="w-full lg:w-[58%]">
                  <GalleryFile
                    gallery={project?.gallery}
                    title={project?.title}
                    propertyId={project?._id}
                    propertyType="Land"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <div className="p-4 sm:p-2">

                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                          <DetailItem
                            label="Total Area"
                            value={`${project?.plotArea ?? "—"} sqft (₹ ${project?.pricePerSqft ?? 0}/sqft)`}
                          />

                          <DetailItem
                            label="Water Connection"
                            value={project?.waterConnection ? "Available" : "Unavailable"}
                          />

                          <DetailItem
                            label="Sale Type"
                            value={project?.listingType}
                            highlight
                          />

                          <DetailItem
                            label="Availability Status"
                            value={project?.readyToConstruct ? "Ready to Construct" : "Under Construction"}
                          />

                          <DetailItem
                            label="Property Type"
                            value={project?.propertyType}
                          />

                          <DetailItem
                            label="Approved By"
                            value={project?.approvedByAuthority?.join(", ")}
                          />

                        </div>
                        <div className="flex flex-wrap gap-6 mt-8 border-t border-gray-200 pt-6">
                          <StatItem
                            icon={<GiCompass className="text-[#6B7280] h-5 w-5" />}
                            text={project?.facing ?? "—"}
                          />

                          <StatItem
                            icon={<FaRoad className="text-[#6B7280] h-5 w-5" />}
                            text={`${project?.roadWidthFt ?? 0} ft`}
                          />

                          <StatItem
                            icon={<BiShapeSquare className="text-[#6B7280] h-5 w-5" />}
                            text={project?.cornerPlot ? "Corner Plot" : "Non-Corner Plot"}
                          />

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <br />

              <div className=" w-full">
                <div className="grid gap-4">
                  <section className="space-y-4">
                    <section className="rounded-xl p-6 bg-[#f7f9fa] shadow-sm border border-gray-100">
                      <h2 className="mb-6 text-xl font-semibold text-gray-900">
                        More Details
                      </h2>

                      {/* DETAILS GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">

                        <DetailItem
                          label="Price Breakup"
                          value={`₹${project?.price ?? "—"}`}
                        />

                        <DetailItem
                          label="Property Ownership"
                          value={ownershipLabel}
                        />

                        <DetailItem
                          label="Fencing"
                          value={project?.fencing ? "Available" : "Unavailable"}
                        />

                      </div>

                      {/* ADDRESS */}
                      <div className="mt-10">
                        <p className="font-medium text-gray-900">Address</p>
                        <p className="text-gray-600 mt-2 leading-relaxed truncate">
                          {project.address || "—"}
                        </p>
                      </div>

                      {/* DESCRIPTION */}
                      <div className="mt-8">
                        <p className="font-medium text-gray-900">Description</p>
                        <p className="text-gray-600 mt-2 leading-relaxed truncate">
                          {project.description || "—"}
                        </p>
                      </div>

                      <div className="mt-10">
                        <ContactOwnerButton
                          projectId={project._id}
                          propertyType="landplots"
                          listingType={project.listingType}
                          listingSource={resolvedListingSource}
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
                          {project.amenities.map((amenity: any, index) => {
                            const icon =
                              amenityIconByKey.get(amenity.key) ??
                              amenityIconByTitle.get(amenity.title);

                            return (
                              <div
                                key={amenity.key || index}
                                className="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1"
                              >
                                {typeof icon === "string" ? (
                                  <Image
                                    src={icon.trim()}
                                    alt={`${amenity.title} icon`}
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
                                <span>{amenity.title}</span>
                              </div>
                            );
                          })}
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
                        <NearByPlace
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
                        <RelatedLandCarousel
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
            <aside className="w-full shrink-0 lg:w-[260px] sticky top-20 self-start">              {/* Contact card here */}
              <div className="sticky top-20 h-fit rounded-xl border border-gray-100 bg-[#f7f9fa] p-5 shadow-sm">
                <p className="mb-3 text-lg font-semibold text-green-600">
                  Contact Owner
                </p>

                <p className="text-sm font-medium text-gray-900">
                  {project?.createdBy?.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {project?.createdBy?.email}
                </p>

                <button className="mt-4 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition hover:bg-green-700">
                  Get Phone No.
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}


const DetailItem = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string | number;
  highlight?: boolean;
}) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-gray-500">
      {label}
    </p>
    <p className={`text-sm sm:text-base font-semibold ${highlight ? "text-[#ed6115]" : "text-gray-800"
      }`}>
      {value || "—"}
    </p>
  </div>
);

const StatItem = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <div className="flex items-center gap-2 text-gray-600 font-medium text-sm sm:text-base">
    <span className="flex h-5 w-5 items-center justify-center">
      {icon}
    </span>
    {text}
  </div>
);
