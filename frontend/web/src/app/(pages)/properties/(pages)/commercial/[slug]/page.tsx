import { getCommercialSlugProjects } from "@/data/serverData";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { minDelay } from "@/utilies/minDelay";
import { notFound } from "next/navigation";
import { MdEventSeat, MdMeetingRoom } from "react-icons/md";
import { ICommercial } from "@/types/commercial";
import GalleryFile from "../../../GalleryFile";
import {
  FaCarAlt,
  FaParking,
  FaRegCalendarCheck,
  FaRegUser,
} from "react-icons/fa";

import ContactOwnerButton from "@/components/ContactOwnerButton";
import PropertyViewDurationTracker from "@/components/PropertyViewDurationTracker";
import RelatedCommercialCarousel from "./RelatedCommercialCarousel";
import Image from "next/image";
import { COMMERCIAL_AMENITIES } from "@/app/(pages)/postproperty/constants/amenities";
import SponsoreCard from "../../../cards/SponsoreCard";
import {
  PiArmchair,
  PiCalendarBlank,
  PiCoffee,
  PiMotorcycle,
  PiWall,
} from "react-icons/pi";
import { RiCarLine } from "react-icons/ri";
import { GiMoneyStack } from "react-icons/gi";
import { TilesIcons } from "../../MoreDetailsIcons";
import { HiOutlineUser } from "react-icons/hi2";
import CommercialNearbySection from "./CommercialNearbySection";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

const bgcolor = hexToRGBA("#27AE60", 0.08);
const amenityIconByKey = new Map(
  COMMERCIAL_AMENITIES.map((amenity) => [amenity.key, amenity.icon]),
);
const amenityIconByTitle = new Map(
  COMMERCIAL_AMENITIES.map((amenity) => [amenity.title, amenity.icon]),
);

const formatTenantMonthYear = (value?: unknown) => {
  if (!value) return null;

  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
  if (!date) return null;
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatTenantRent = (rent?: unknown) => {
  if (rent === undefined || rent === null || rent === "") return null;

  const amount =
    typeof rent === "number"
      ? rent
      : typeof rent === "string"
        ? Number(rent)
        : NaN;
  if (Number.isNaN(amount) || amount <= 0) return null;

  const compact = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);

  return `₹ ${compact}/month`;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  let project: ICommercial | null;
  try {
    [project] = await Promise.all([
      getCommercialSlugProjects({ slug }),
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

  if (!project) {
    notFound();
  }

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
      value: project.isPriceNegotiable ? "Yes" : "No",
      icon: GiMoneyStack,
    },
    {
      label: "Pantry",
      value: project?.pantry?.type ?? "N/A",
      icon: PiCoffee,
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
      label: "Wall Finishing",
      value: ((project as any)?.wallFinishStatus ?? "N/A").toString(),
      icon: PiWall,
    },
    {
      label: "Flooring Type",
      value: ((project as any)?.flooringType ?? "N/A").toString(),
      icon: TilesIcons,
    },
    {
      label: "Age of Property",
      value: project?.propertyAge?.toString() ?? "N/A",
      icon: PiCalendarBlank,
    },
  ];

  return (
    <div className="min-h-screen py-6 overflow-hidden">
      <PropertyViewDurationTracker
        projectId={String(project._id)}
        propertyType="commercials"
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
                    propertyType="Commercial"
                  />
                </div>
                <div className="flex min-w-0 flex-1 self-stretch min-h-0">
                  <div className="flex h-full min-w-0 flex-1 flex-col justify-between gap-8 p-4 sm:p-2">
                    {/* PART 1 */}
                    <div className="grid grid-cols-2 gap-8 pl-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Built Up Area
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          ₹ {project?.pricePerSqft ?? 0}/sqft
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
                        <span className="capitalize text-sm sm:text-base font-semibold text-gray-900">
                          {project?.transactionType ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Availability Status
                        </span>
                        <span className="capitalize text-sm sm:text-base font-semibold text-gray-900">
                          {project?.constructionStatus}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Furnishing Status
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900 capitalize">
                          {project?.furnishedStatus ?? "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          Floors
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {project?.floorNumber ?? "—"}/
                          {project?.totalFloors ?? "—"}
                        </span>
                      </div>
                    </div>

                    {/* ICON STATS */}
                    <div
                      className="grid grid-cols-3 border border-gray-200 rounded-md overflow-hidden shadow-sm"
                      style={{ background: bgcolor }}
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4">
                        <FaParking color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {project?.parkingCapacity ?? 0}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          Parking
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 border-x border-gray-200">
                        <MdEventSeat color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {project?.seats ?? 0}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          Seats
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4">
                        <MdMeetingRoom color="#6B7280" />
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {project?.officeRooms ?? 0}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          Rooms
                        </span>
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
                      <h2 className="mb-5 text-xl font-semibold text-gray-900">
                        More Details
                      </h2>

                      <div className="grid grid-cols-2 gap-4 text-sm xl:grid-cols-4">
                        {detailsItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.label}
                              className="grid grid-cols-[32px_1fr] grid-rows-2 gap-x-3 items-center"
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
                              <p className="text-gray-500 wrap-break-word capitalize">
                                {item.value}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-8">
                        <p className="font-medium text-gray-900">Address</p>
                        <p className="text-gray-500 mt-1 leading-relaxed">
                          {project.address}
                        </p>
                      </div>

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
                          propertyType="commercials"
                          listingSource={project.listingSource}
                          ownerName={project?.createdBy?.name}
                          ownerPhone={
                            project?.createdBy?.contact ??
                            (project as any)?.phone
                          }
                          ownerEmail={project?.createdBy?.email}
                          postedOn={(project as any)?.createdAt}
                          price={project?.price}
                          propertyLabel={project?.title}
                        />
                      </div>
                    </section>

                    <section className="rounded-lg p-4 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-3 text-xl font-semibold text-gray-900">
                        Tenant information
                      </h2>
                      {project.tenantInfo && project.tenantInfo.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-3">
                          {project.tenantInfo.map((tenant, index) => {
                            const tenantName =
                              tenant.currentTenant?.trim() || "Tenant";
                            const tenantInitial = tenantName
                              .charAt(0)
                              .toUpperCase();
                            const leaseStart = formatTenantMonthYear(
                              tenant.leaseStart,
                            );
                            const leaseEnd = formatTenantMonthYear(
                              tenant.leaseEnd,
                            );
                            const rent = formatTenantRent(tenant.rent);

                            return (
                              <div
                                key={`${tenant.currentTenant ?? "tenant"}-${index}`}
                                className="rounded-md bg-[#ececec] p-4"
                              >
                                <p className="text-base leading-none text-[#22a85b]">
                                  {rent ?? "Rent not available"}
                                </p>
                                <div className="mt-4 flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#dce9df] text-2xl leading-none text-[#22a85b]">
                                    {tenantInitial}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-base font-medium text-gray-900">
                                      {tenantName}
                                    </p>
                                    <p className="text-base text-gray-500">
                                      {leaseStart && leaseEnd
                                        ? `${leaseStart} - ${leaseEnd}`
                                        : leaseStart
                                          ? `From ${leaseStart}`
                                          : leaseEnd
                                            ? `Until ${leaseEnd}`
                                            : "Lease period not available"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Tenant information not available.
                        </p>
                      )}
                    </section>

                    {/* Amenities */}
                    <section className="rounded-lg p-4 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-3 text-xl font-semibold text-gray-900">
                        Amenities
                      </h2>
                      {project.amenities && project.amenities.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 sm:grid-cols-3">
                          {project.amenities.map((i, index) =>
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

                    {/* Nearby */}
                    <section className="rounded-lg p-4 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-3 text-xl font-semibold text-gray-900">
                        Popular Landmarks Nearby
                      </h2>
                      {project.location ? (
                        <CommercialNearbySection
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

                    {/* Related */}
                    <section className="rounded-lg p-4 shadow-sm bg-[#f7f9fa]">
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">
                        More Similar Properties for you
                      </h2>

                      {project.relatedProjects &&
                        project.relatedProjects.length > 0 ? (
                        <RelatedCommercialCarousel
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
}
