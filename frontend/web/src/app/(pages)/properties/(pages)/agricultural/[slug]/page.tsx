import { getAgriculturalSlugProjects } from "@/data/serverData";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { notFound } from "next/navigation";
import GalleryFile from "../../../GalleryFile";
import { MdWaterDrop } from "react-icons/md";
import { GiGroundSprout } from "react-icons/gi";
import { FaRoad } from "react-icons/fa";
import { IAgricultural } from "@/types/agricultural";
import NearByPlace from "@/app/(pages)/properties/(pages)/NearByPlace";
import ContactOwnerButton from "@/components/ContactOwnerButton";
import RelatedAgriculturalCarousel from "./RelatedAgriculturalCarousel";
import Image from "next/image";
import { AGRICULTURAL_AMENITIES } from "@/app/(pages)/postproperty/constants/amenities";

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
    project = await getAgriculturalSlugProjects({ slug });
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
  console.log(project);


  return (
    <div style={{ background: bgcolor }} className="min-h-screen py-6">
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

                <div className="w-full lg:w-[58%]">
                  <GalleryFile
                    gallery={project?.gallery}
                    title={project?.title}
                    propertyId={project?._id}
                    propertyType="Agricultural"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <div className="p-4 sm:p-6">

                        {/* DETAILS GRID */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                          <DetailItem
                            label="Plot Area"
                            value={`(₹ ${project?.pricePerSqft ?? 0}/sqft)`}
                          />

                          <DetailItem
                            label="Boundary Wall"
                            value={project?.boundaryWall ? "Available" : "Not Available"}
                          />

                          <DetailItem
                            label="Listed Type"
                            value={project?.listingType}
                            highlight
                          />

                          <DetailItem
                            label="Irrigation Type"
                            value={project?.irrigationType}
                          />

                          <DetailItem
                            label="Electricity"
                            value={project?.electricityConnection ? "Available" : "Not Available"}
                          />

                          <DetailItem
                            label="Land shape"
                            value={project?.landShape}
                          />

                        </div>

                        {/* ICON STATS */}
                        <div className="flex flex-wrap gap-6 mt-8 border-t border-gray-200 pt-6">

                          <StatItem
                            icon={<MdWaterDrop color="#6B7280" size={20} />}
                            text={`${project?.numberOfBorewells ?? 0} Borewells`}
                          />

                          <StatItem
                            icon={<GiGroundSprout color="#6B7280" size={20} />}
                            text={project?.soilType ?? "—"}
                          />

                          <StatItem
                            icon={<FaRoad color="#6B7280" size={20} />}
                            text={`${project?.roadWidth?.value ?? 0} ${project?.roadWidth?.unit ?? ""}`}
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
                    <section className="rounded-lg p-6 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-6 text-xl font-semibold text-gray-900">
                        More Details
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
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
                            Total Area
                          </p>
                          <p className="text-gray-500">
                            {project?.totalArea?.value}{" "}
                            {project?.totalArea?.unit}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            Land Shape
                          </p>
                          <p className="text-gray-500">{project?.landShape}</p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            Road Width
                          </p>
                          <p className="text-gray-500">
                            {project?.roadWidth?.value}{" "}
                            {project?.roadWidth?.unit}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            Soil Type
                          </p>
                          <p className="text-gray-500">{project?.soilType}</p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            Irrigation
                          </p>
                          <p className="text-gray-500">
                            {project?.irrigationType}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            Electricity
                          </p>
                          <p className="text-gray-500">
                            {project?.electricityConnection
                              ? "Available"
                              : "No"}
                          </p>
                        </div>
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
                          projectId={project._id}
                          propertyType="agriculturals"
                          listingSource={project.listingSource}
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
                          {project.amenities.map((i, index) => {
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

                    <section className="rounded-lg p-4 shadow-sm bg-[#f7f9fa] ">
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
            <aside className="w-full shrink-0 lg:w-[260px]">
              {/* Contact card here */}
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
    {icon}
    {text}
  </div>
);