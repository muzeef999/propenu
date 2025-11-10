import Link from "next/link";
import ap_one from "@/asserts/ap_one.png";
import Farm_house from "@/asserts/Farm_house.png";
import Ind_one from "@/asserts/Ind_one.png";
import Res from "@/asserts/Res.png";

const CATEGORIES = [
  {
    id: "residential-apartment",
    title: "Residential Apartment",
    image:ap_one,
    imageAlt: "Modern apartment tower at dusk",
    countText: "13,000+ Properties",
    color:"#FFF0E5",
    href: "/properties/residential-apartment",
  },
  {
    id: "residential-land",
    title: "Residential Land",
     color:"#FFF0E5",
    image:Farm_house,
    imageAlt: "Wide green land plots and dirt road",
    countText: "9,500+ Properties",
    href: "/properties/residential-land",
  },
  {
    id: "farm-house",
    title: "Farm House",
     color:"#FFF0E5",
    image:Ind_one,
    imageAlt: "Cozy farm house with porch and lawn",
    countText: "3,200+ Properties",
    href: "/properties/farm-house",
  },
  {
    id: "villa",
    title: "Independent House / Villa",
     color:"#FFF0E5",
    image:Res,
    imageAlt: "Mediterranean villa with palm trees",
    countText: "5,800+ Properties",
    href: "/properties/independent-house-villa",
  },
];

// --- Card UI ---------------------------------------------------------------

export function PropertyCard({ item }: { item: (typeof CATEGORIES)[number] }) {
  return (
    <Link
      href={item.href}
      aria-label={`${item.title} – ${item.countText}`}
      className="relative flex h-[330px] w-full overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-lg bg-[#F8EDE9]"
    >
      {/* Text Section */}
      <div className="z-10 flex flex-col gap-2 p-6">
        <h3 className="text-[32px] leading-[1.2] font-semibold text-gray-900">
          {item.title}
        </h3>

        <p className="text-[20px] text-gray-500 font-medium">
          {item.countText}
        </p>
      </div>

      {/* Image Section */}
      <div className="absolute bottom-0 right-0 w-full h-[55%]">
        <img
          src={item.image.src}
          alt={item.imageAlt}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
        />
      </div>
    </Link>
  );
}


// --- Page ------------------------------------------------------------------
export default function ExploreMorePropertiesPage() {
  return (
    
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
       
        {/* Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((item) => (
            <PropertyCard key={item.id} item={item} />
          ))}
        </section>

        {/* JSON-LD for SEO (category list) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Explore More Properties",
              description:
                "Explore Hyderabad property categories including apartments, residential land, farm houses and villas.",
              hasPart: CATEGORIES.map((c) => ({
                "@type": "Collection",
                name: c.title,
                url: c.href,
              })),
            }),
          }}
        />
      </main>
    
  );
}

