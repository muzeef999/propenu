import { getResidentialSlugProjects } from "@/data/serverData";
import { IResidential } from "@/types/residential";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { notFound } from "next/navigation";
import Image from "next/image";
import GalleryFile from "../../../GalleryFile";
import { Balconies, Bath, Bhk, BHK } from "@/icons/icons";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

const bgcolor = hexToRGBA("#27AE60", 0.08);

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  let project: IResidential | null;
  try {
    project = await getResidentialSlugProjects({ slug });
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

          <div className="flex">
            <div className="w-[50%]">
             <GalleryFile gallery={project?.gallery}/>
             </div>
             <div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-16">
              <div>
              <p className="text-gray-500 font-mono">SUPER BUILT UP AREA</p>
              <p>{project?.superBuiltUpArea} sqft (₹ {project?.pricePerSqft}/sqft)</p>

               </div>

               <div>
              <p className="text-gray-500 font-mono">CARPET AREA</p>
              <p>{project?.carpetArea}</p>
               </div>

               <div>
              <p className="text-red-600 font-mono">TRANSACTION TYPE</p>
              <p>{project?.superBuiltUpArea}</p>
               </div>

               <div>
              <p className="text-gray-500 font-mono">AVAILABILITY STATUS</p>
              <p>{project?.constructionStatus}</p>
               </div>

               
               <div>
              <p className="text-gray-500 font-mono">FURNISHED STATUS</p>
              <p>{project?.furnishing}</p>
               </div>

               
               <div>
              <p className="text-gray-500 font-mono">FLOORS</p>
              <p>{project?.floorNumber}/{project.totalFloors}</p>
               </div>

             </div>
             <div className="flex gap-x-8 mt-6">
              <span className="text-gray-500 text-md font-medium flex"><Bhk color="#6B7280"/>&nbsp; {project.bhk} BHK</span>
              <span className="text-gray-500  font-medium flex"><Bath color="#6B7280"/>&nbsp;{project.bathrooms} Bath</span>
              <span className="text-gray-500  font-medium flex"><Balconies color="#6B7280"/>&nbsp; {project.balconies} Balconies</span>
            </div>
             </div>
          </div>

          <br/>

        {/* Main two-column layout */}
        <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
          {/* Left: Gallery + basic info */}
          <section className="space-y-4">
            {/* More details section */}
            <section className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                More Details
              </h2>

              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <DetailItem
                  label="Super Built-up Area"
                  value={
                    project.superBuiltUpArea
                      ? `${project.superBuiltUpArea} sqft`
                      : "-"
                  }
                />
                <DetailItem
                  label="Built-up Area"
                  value={
                    project.builtUpArea ? `${project.builtUpArea} sqft` : "-"
                  }
                />
                <DetailItem
                  label="Carpet Area"
                  value={
                    project.carpetArea ? `${project.carpetArea} sqft` : "-"
                  }
                />
                <DetailItem
                  label="Furnishing"
                  value={project.furnishing || "Unfurnished"}
                />
                <DetailItem
                  label="Floor"
                  value={
                    project.floorNumber && project.totalFloors
                      ? `${project.floorNumber} out of ${project.totalFloors}`
                      : "-"
                  }
                />
                <DetailItem
                  label="Parking"
                  value={
                    project.parkingDetails
                      ? `${project.parkingDetails.fourWheeler || 0} four-wheeler, ${
                          project.parkingDetails.twoWheeler || 0
                        } two-wheeler`
                      : "-"
                  }
                />
                <DetailItem
                  label="Maintenance"
                  value={
                    project.maintenanceCharges
                      ? `₹${project.maintenanceCharges} / month`
                      : "Not specified"
                  }
                />
                <DetailItem
                  label="Possession"
                  value={
                    project.constructionStatus === "ready-to-move"
                      ? "Ready to move"
                      : project.possessionDate
                      ? new Date(project.possessionDate).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "Not specified"
                  }
                />
              </div>

              {/* Address & description */}
            
            </section>

            {/* Amenities */}
            <section className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                Amenities
              </h2>
              {project.amenities && project.amenities.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 sm:grid-cols-3">
                  {project.amenities.map((amenity: string) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{amenity}</span>
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

          {/* Right column: Summary + security + loan card */}
          <aside className="space-y-4">
            {/* Overview card */}
            <section className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                Property Overview
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <OverviewRow
                  label="Type"
                  value={project.listingType === "sale" ? "For Sale" : "For Rent"}
                />
                <OverviewRow
                  label="Transaction Type"
                  value={project.isFeatured ? "New Property" : "Resale"}
                />
                <OverviewRow
                  label="Status"
                  value={project.constructionStatus || "N/A"}
                />
                <OverviewRow
                  label="Gated Security"
                  value={project.security?.gated ? "Yes" : "No"}
                />
                <OverviewRow
                  label="Security Guard"
                  value={project.security?.guard ? "Available" : "Not available"}
                />
                <OverviewRow
                  label="Smart Features"
                  value={
                    project.smartHomeFeatures?.length
                      ? project.smartHomeFeatures
                          .map((s: string) =>
                            s
                              .split("-")
                              .map(
                                (p) => p.charAt(0).toUpperCase() + p.slice(1)
                              )
                              .join(" ")
                          )
                          .join(", ")
                      : "None"
                  }
                />
              </div>
            </section>

            {/* Loan assistance card */}
            <section className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-gray-900">
                Loan Offered / Assistance
              </h2>
              <p className="mb-3 text-xs text-gray-500">
                Get best offers from partner banks based on your eligibility.
              </p>

              <div className="mb-4 rounded-md bg-emerald-50 p-3 text-xs text-gray-800">
                <p>
                  Estimated EMI:{" "}
                  <span className="font-semibold">
                    {/* simple rough EMI example */}
                    {formatINR(Math.round(project.price / (15 * 12)))}
                  </span>{" "}
                  / month (approx for 15 years)
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-md border border-gray-200 px-3 py-1">
                  HDFC Bank
                </span>
                <span className="rounded-md border border-gray-200 px-3 py-1">
                  Axis Bank
                </span>
                <span className="rounded-md border border-gray-200 px-3 py-1">
                  SBI
                </span>
              </div>

              <button className="mt-4 w-full rounded-md bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Apply for Home Loan
              </button>
            </section>
          </aside>
        </div>
        </div>
         <div className="w-[20%]">
            <h1>contact owner</h1>
          </div>
      </div>
    </div>
  );
}

/* ---------- small presentational components ---------- */


function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-gray-500">{label}</div>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}
