import { getLandSlugProjects } from "@/data/serverData";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { notFound } from "next/navigation";
import { ILand } from "@/types/land";
import GalleryFile from "../../../GalleryFile";
import { GiCompass } from "react-icons/gi";
import { FaRoad } from "react-icons/fa";
import { BiShapeSquare } from "react-icons/bi";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

const bgcolor = hexToRGBA("#27AE60", 0.08);

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
  console.log("Project data:", project);

  const priceLabel = formatINR(project?.price);

  return (
    <div style={{ background: bgcolor }} className="min-h-screen py-6">
      <div className="container">
        <div className="w-full">
          {/* Top: Price + Title + CTA */}
          <header className="flex flex-col justify-between gap-2 p-2">
            <div className="">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="rounded-full px-1 text-2xl font-semibold text-primary">
                  {priceLabel}
                </span>
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-xl">
                  {project.title},{project.city}
                </h1>
              </div>
            </div>
          </header>

          <div className="flex gap-2">
            <div className="w-[45%]">
              <GalleryFile gallery={project?.gallery} title={project?.title} />
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-7 gap-x-7 p-2">
                    <div>
                      <p className="text-gray-500 font-semibold">Total Area</p>
                      <p>
                        {project?.plotArea} sqft (₹ {project?.pricePerSqft}
                        /sqft)
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Electricity Connection</p>
                      <p>{project?.boundryWall}</p>
                    </div>

                    <div>
                      <p className="text-[#ed6115] font-semibold">Sale Type</p>
                      <p>{project?.saleType}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Availability Status</p>
                      <p>{project?.readyToConstruct ? "Ready to Construct" : "Under Construction"}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Frunishing Status</p>
                      <p>{project?.furnishing}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Approved By</p>
                      <p>
                        {project?.approvedByAuthority?.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-x-8 mt-11">
                    <span className="text-gray-500 text-md font-medium flex items-center gap-2">
                      <GiCompass size={20} />
                      {project.facing} 
                    </span>
                    <span className="text-gray-500 text-md font-medium flex items-center gap-2">
                      <FaRoad size={18} />
                      {project.roadWidthFt} Road ft 
                    </span>
                    <span className="text-gray-500 text-md font-medium flex items-center gap-2">
                      <BiShapeSquare size={18} />
                      {project.cornerPlot ? "Corner Plot" : "Non-Corner Plot"}
                    </span>
                  </div>
                </div>

                {/* Contact card here */}
                <div className="w-[260px] shrink-0 rounded-xl bg-white/30 p-5 shadow-sm border border-gray-100">
                  <p className="text-lg font-semibold text-green-600 mb-3">
                    Contact Owner
                  </p>

                  <p className="text-sm font-medium text-gray-900">
                    {project?.createdBy?.name}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {project?.createdBy?.email}
                  </p>

                  <button className="mt-4 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 transition">
                    Get Phone No.
                  </button>
                </div>
              </div>
            </div>
          </div>

          <br />

          {/* Main two-column layout */}
          <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
            <section className="space-y-4 ml-3">
              <section className="rounded-lg p-6 shadow-sm ">
                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                  More Details
                </h2>

                {/* Changed to 4 columns to match the wide layout in the image */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">

                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-gray-900">Price Breakup</p>
                    <p className="text-gray-500">₹{project?.price}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-gray-900">Property Ownership</p>
                    <p className="text-gray-500">{project?.listingSource}</p>
                  </div>


                  <div className="hidden md:block"></div>
                  <div className="hidden md:block"></div>

                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-gray-900">Fencing</p>
                    <p className="text-gray-500">{project?.fencing? "Available" : "Unavailable"}</p>
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
                  <p className="font-medium text-gray-900">Description:</p>
                  <p className="text-gray-500 mt-1 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="mt-8">
                  <button className="rounded bg-[#27AE60] px-6 py-2 font-medium text-white hover:bg-green-700">
                    Contact Owner
                  </button>
                </div>
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

      </div>
    </div>
  );
}
