import { getResidentialSlugProjects } from "@/data/serverData";
import { IResidential } from "@/types/residential";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import { notFound } from "next/navigation";
import GalleryFile from "../../../GalleryFile";
import { Balconies, Bath, Bhk } from "@/icons/icons";

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
              <GalleryFile gallery={project?.gallery} />
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-16 mt-5 ml-5">
                <div>
                  <p className="text-gray-500 font-poppins">SUPER BUILT UP AREA</p>
                  <p>
                    {project?.superBuiltUpArea} sqft (₹ {project?.pricePerSqft}
                    /sqft)
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">CARPET AREA</p>
                  <p>{project?.carpetArea}</p>
                </div>

                <div>
                  <p className="text-[#ed6115]">TRANSACTION TYPE</p>
                  <p>{project?.transactionType}</p>
                </div>

                <div>
                  <p className="text-gray-500">AVAILABILITY STATUS</p>
                  <p>{project?.constructionStatus}</p>
                </div>

                <div>
                  <p className="text-gray-500">FURNISHED STATUS</p>
                  <p>{project?.furnishing}</p>
                </div>

                <div>
                  <p className="text-gray-500">FLOORS</p>
                  <p>
                    {project?.floorNumber}/{project.totalFloors}
                  </p>
                </div>
              </div>
              <div className="flex gap-x-8 mt-6 ml-5">
                <span className="text-gray-500 text-md font-medium flex">
                  <Bhk color="#6B7280" />
                  &nbsp; {project.bhk} BHK
                </span>
                <span className="text-gray-500  font-medium flex">
                  <Bath color="#6B7280" />
                  &nbsp;{project.bathrooms} Bath
                </span>
                <span className="text-gray-500  font-medium flex">
                  <Balconies color="#6B7280" />
                  &nbsp; {project.balconies} Balconies
                </span>
              </div>
            </div>
          </div>

          <br />

          {/* Main two-column layout */}
          <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr] mt-55">
            {/* Left: Gallery + basic info */}
            <section className="space-y-4 ml-3">
              {/* More details section */}
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
                    <p className="font-medium text-gray-900">Facing</p>
                    <p className="text-gray-500">East</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-gray-900">Flooring</p>
                    <p className="text-gray-500">{project?.flooringType}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-gray-900">Kitchen Type</p>
                    <p className="text-gray-500">{project?.kitchenType}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-gray-900">No of parkings</p>
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


