import {
  getCommercialSlugProjects,
  getResidentialSlugProjects,
} from "@/data/serverData";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { notFound } from "next/navigation";
import GalleryFile from "../../../GalleryFile";
import { Chair, Office, WashRoom } from "@/icons/icons";
import { ICommercial } from "@/types/commercial";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

const bgcolor = hexToRGBA("#27AE60", 0.08);

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  let project: ICommercial | null;
  try {
    project = await getCommercialSlugProjects({ slug });
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

  const hasUtilities =
    project.powerBackup ||
    project.powerCapacityKw ||
    project.lift !== undefined ||
    project.washrooms !== undefined ||
    project.maintenanceCharges;

  const hasSafety =
    project.fireSafety !== undefined ||
    project.ceilingHeightFt !== undefined ||
    project.builtYear !== undefined;

  const hasLogistics =
    project.loadingDock !== undefined ||
    project.loadingDockDetails ||
    project.parkingCapacity ||
    project.zoning;

  const hasPantry = !!project.pantry;
  const hasLayout =
    project.officeRooms ||
    project.cabins ||
    project.meetingRooms ||
    project.conferenceRooms ||
    project.seats ||
    project.floorNumber ||
    project.totalFloors ||
    project.furnishedStatus;

  const hasTenant = project.tenantInfo && project.tenantInfo.length > 0;
  const hasBuildingMgmt = !!project.buildingManagement;
  const hasSpecs = project.specifications && project.specifications.length > 0;

  const mainTenant = hasTenant ? project.tenantInfo![0] : undefined;

  return (
    <div style={{ background: bgcolor }} className="min-h-screen py-6">
      <div className="container">
        <div className="w-[80%]">
          {/* Top: Price + Title + CTA */}
          <header className="mb-4 flex flex-col justify-between gap-4  p-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="rounded-full  px-3 py-1 text-2xl font-semibold text-primary">
                  {priceLabel}
                </span>
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-xl">
                  {project.title},{project.city}
                </h1>
              </div>
            </div>
          </header>

          {/* section 2 */}

          <div className="flex h-[450px] flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Left: Gallery */}
            <div className="w-full lg:w-1/2">
              <GalleryFile gallery={project?.gallery} />
            </div>

            {/* Right: Details */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between gap-6">
              {/* Top stats grid */}
              <br />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10">
                {/* SUPER BUILT UP AREA */}

                <div>
                  <p className="text-base font-semibold tracking-wider text-gray-500 uppercase">
                    Super Built Up Area
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {project?.superBuiltUpArea
                      ? `${project.superBuiltUpArea} sqft`
                      : "-"}
                    {project?.pricePerSqft && (
                      <span className="text-gray-500 text-xs sm:text-sm">
                        {` (₹ ${project.pricePerSqft}/sqft)`}
                      </span>
                    )}
                  </p>
                </div>

                {/* CARPET AREA */}
                <div>
                  <p className="text-base font-semibold tracking-wide text-gray-500 uppercase">
                    Carpet Area
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {project?.carpetArea ? `${project.carpetArea} sqft` : "-"}
                  </p>
                </div>

                {/* TRANSACTION TYPE */}
                <div>
                  <p className="text-base font-semibold tracking-wider text-red-600 uppercase">
                    Transaction Type
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {project?.transactionType || "-"}
                  </p>
                </div>

                {/* AVAILABILITY STATUS */}
                <div>
                  <p className="text-base font-semibold tracking-wider text-gray-500 uppercase">
                    Availability Status
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {project?.constructionStatus || "-"}
                  </p>
                </div>

                {/* FURNISHED STATUS */}
                <div>
                  <p className="text-base font-semibold tracking-wide text-gray-500 uppercase">
                    Furnished Status
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {project?.furnishedStatus || "-"}
                  </p>
                </div>

                {/* FLOORS */}
                <div>
                  <p className="text-base font-semibold tracking-wide text-gray-500 uppercase">
                    Floors
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {project?.floorNumber != null &&
                    project?.totalFloors != null
                      ? `${project.floorNumber}/${project.totalFloors}`
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Bottom icons row */}
              <div className="flex flex-wrap gap-4 sm:gap-6 pt-4 border-t border-gray-100">
                <span className="inline-flex items-center gap-2 text-gray-600 text-sm sm:text-base font-medium">
                  <Chair color="#6B7280" />
                  {project?.seats ?? 0} Seats
                </span>

                <span className="inline-flex items-center gap-2 text-gray-600 text-sm sm:text-base font-medium">
                  <Office color="#6B7280" />
                  {project?.officeRooms ?? 0} Office rooms
                </span>

                <span className="inline-flex items-center gap-2 text-gray-600 text-sm sm:text-base font-medium">
                  <WashRoom color="#6B7280" />
                  {project?.washrooms ?? 0} Washrooms
                </span>
              </div>
            </div>
          </div>

          {/* section 3 */}

          <h1>Hello</h1>
          <h1>Hello</h1>
          <h1>Hello</h1>
          <h1>Hello</h1>
          <h1>Hello</h1>
          <h1>Hello</h1>
          <h1>Hello</h1>

          {/* Main two-column layout */}
          <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
            {/* Left: Gallery + basic info */}
            <section className="space-y-4">
              {/* More details section */}
              <section className="rounded-lg p-4 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-gray-900">
                  More Details
                </h2>

                {/* Utilities & Infrastructure */}
                {hasUtilities && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Utilities & Infrastructure
                    </p>
                    <div className="grid grid-cols-1 gap-y-3 gap-x-8 sm:grid-cols-2">
                      {project.powerBackup && (
                        <DetailRow
                          label="Power Backup"
                          value={project.powerBackup}
                        />
                      )}
                      {project.powerCapacityKw !== undefined && (
                        <DetailRow
                          label="Power Capacity"
                          value={`${project.powerCapacityKw} kW`}
                        />
                      )}
                      {project.lift !== undefined && (
                        <DetailRow
                          label="Lift"
                          value={project.lift ? "Available" : "Not available"}
                        />
                      )}
                      {project.maintenanceCharges !== undefined && (
                        <DetailRow
                          label="Maintenance Charges"
                          value={`₹ ${project.maintenanceCharges.toLocaleString(
                            "en-IN"
                          )}`}
                        />
                      )}
                    </div>
                  </div>
                )}

                  {/* Safety */}
                 {hasSafety && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Safety & Compliance
                    </p>
                    <div className="grid grid-cols-1 gap-y-3 gap-x-8 sm:grid-cols-3">
                      {project.fireSafety !== undefined && (
                        <DetailRow
                          label="Fire Safety"
                          value={project.fireSafety ? "Compliant" : "Not specified"}
                        />
                      )}
                      {project.ceilingHeightFt !== undefined && (
                        <DetailRow
                          label="Ceiling Height"
                          value={`${project.ceilingHeightFt} ft`}
                        />
                      )}
                      {project.builtYear !== undefined && (
                        <DetailRow label="Year Built" value={project.builtYear} />
                      )}
                    </div>
                  </div>
                )}


                {/* Logistics */}
                {hasLogistics && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Logistics & Parking
                    </p>
                    <div className="grid grid-cols-1 gap-y-3 gap-x-8 sm:grid-cols-2">
                      {project.loadingDock !== undefined && (
                        <DetailRow
                          label="Loading Dock"
                          value={project.loadingDock ? "Available" : "Not available"}
                        />
                      )}
                      {project.parkingCapacity !== undefined && (
                        <DetailRow
                          label="Parking Capacity"
                          value={`${project.parkingCapacity} vehicles`}
                        />
                      )}
                      {project.loadingDockDetails && (
                        <DetailRow
                          label="Loading Dock Details"
                          value={project.loadingDockDetails}
                        />
                      )}
                    </div>
                  </div>
                )}
                
                
                {/* Pantry */}
                {hasPantry && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Pantry
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                      {project.pantry?.type && (
                        <Chip label={`Type: ${project.pantry.type}`} variant="sky" />
                      )}
                      {project.pantry?.insidePremises !== undefined && (
                        <Chip
                          label={
                            project.pantry.insidePremises
                              ? "Inside premises"
                              : "Outside premises"
                          }
                          variant="emerald"
                        />
                      )}
                      {project.pantry?.shared !== undefined && (
                        <Chip
                          label={
                            project.pantry.shared
                              ? "Shared pantry"
                              : "Dedicated pantry"
                          }
                          variant="gray"
                        />
                      )}
                    </div>
                  </div>
                )}


                {/* Layout Summary */}
                {hasLayout && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Layout Summary
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                      {project.seats !== undefined && (
                        <Chip label={`${project.seats} seats`} />
                      )}
                      {project.officeRooms !== undefined && (
                        <Chip label={`${project.officeRooms} office rooms`} />
                      )}
                      {project.cabins !== undefined && (
                        <Chip label={`${project.cabins} cabins`} />
                      )}
                      {project.meetingRooms !== undefined && (
                        <Chip label={`${project.meetingRooms} meeting rooms`} />
                      )}
                      {project.conferenceRooms !== undefined && (
                        <Chip
                          label={`${project.conferenceRooms} conference rooms`}
                        />
                      )}
                      {(project.floorNumber !== undefined ||
                        project.totalFloors !== undefined) && (
                        <Chip
                          label={`Floor ${project.floorNumber ?? "?"} of ${
                            project.totalFloors ?? "?"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                )}


  

                <div>
                  <p className="text-base font-mono">Address</p>
                  <p className="text-base text-gray-500">{project.address}</p>
                </div>
                <div>
                  <p className="text-base font-mono">Description</p>
                  <p className="text-base text-gray-500">
                    {project.description}
                  </p>
                </div>
                {/* Address & description */}
              </section>

              {/* Amenities */}
              <section className="rounded-lg p-4 shadow-sm">
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  Amenities
                </h2>
                {project.amenities && project.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 sm:grid-cols-3">
                    {project.amenities.map((i) => (
                      <div
                        key={i.key}
                        className="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{i.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Amenities information not available.
                  </p>
                )}
              </section>
            </section>
          </div>
        </div>

        <div className="w-[20%]">
          <h1>contact owner</h1>
        </div>
      </div>
    </div>
  );
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
      {label}
    </p>
    <p className="mt-1 text-sm text-gray-800">{value ?? "-"}</p>
  </div>
);


type ChipProps = {
  label: string;
  variant?: "gray" | "emerald" | "sky";
};

const Chip: React.FC<ChipProps> = ({ label, variant = "gray" }) => {
  const styles: Record<NonNullable<ChipProps["variant"]>, string> = {
    gray: "bg-gray-100 text-gray-800",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${styles[variant]}`}
    >
      {label}
    </span>
  );
};