import {
  Furnishing,
  Parking,
  Steps,
  SuperBuiitupAraea,
  UnderConstruction,
} from "@/icons/icons";
import { Property } from "@/types/property";
import { hexToRGBA } from "@/ui/hexToRGBA";
import formatINR from "@/utilies/PriceFormat";
import Link from "next/link";
import { AiOutlineHeart } from "react-icons/ai";
import { HiOutlineLocationMarker } from "react-icons/hi";

const bgPriceColor = hexToRGBA("#27AE60", 0.1);

const bgPriceColoricon = hexToRGBA("#27AE60", 0.4);

const CommercialCard: React.FC<{ p: Property }> = ({ p }) => {

  const img = p?.gallery?.[0]?.url ?? "/placeholder-property.jpg";
  
  const pricePerSqft =
    (p as any)?.pricePerSqft ??
    Math.round((p?.price ?? 0) / (p as any)?.superBuiltUpArea || 0);

  return (
    <Link href={`/properties/commercial/${p.slug}`} className="card p-2 h-[220px] flex flex-row overflow-hidden">
      {/* Left: image */}
      <div className="w-40 rounded-xl md:w-56 lg:w-72 relative shrink-0">
        <img
          src={img}
          alt={p?.title ?? "property image"}
          className="h-full w-full object-cover  rounded-xl"
          loading="lazy"
        />
        {/* overlay: image count & date */}
        <div className="absolute left-2 bottom-2 flex items-center gap-2 text-xs text-white">
          <div className="bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M3 7h18M3 12h18M3 17h18"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{p?.gallery?.length ?? 1}</span>
          </div>
        </div>

        {/* favourite icon */}
        <button
          aria-label="favorite"
          className="absolute right-2 top-2 bg-white/90 p-1 rounded-full shadow-sm"
          title="Save"
        >
          <AiOutlineHeart className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Middle: content */}
      <div className="flex-1 p-4 md:p-6 flex flex-col justify-between h-full">
        <div>
          <h3 className="text-lg md:text-xl font-semibold line-clamp-2">
            {p?.title},{p.city}
          </h3>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <HiOutlineLocationMarker className="w-4 h-4" />
            <span className="capitalize">
              {(p as any)?.city ?? ""}
              {(p as any)?.slug ? ` • ${(p as any).slug}` : ""}
            </span>
          </p>
        </div>

        {/* badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs font-normal px-2 py-1 text-primary">
            RERA Approved
          </span>
          <span className="text-xs font-normal px-2 py-1 text-primary">
            Premium
          </span>
          <span className="text-xs font-normal px-2 py-1 text-primary">
            Zero Brokerage
          </span>
        </div>

        {/* meta icons row */}
        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
          <div className="items-center gap-2">
            <SuperBuiitupAraea size={24} color={bgPriceColoricon} />
            <div className="text-xs text-gray-500 tracking-wide">
              SUPER BUILT UP AREA
            </div>
            <div className="tex-black font-medium">
              {(p as any)?.superBuiltUpArea ?? "—"} sqft
            </div>
          </div>

          <div className="items-center gap-2">
            <UnderConstruction size={24} color={bgPriceColoricon} />
            <div className="text-xs text-gray-500 tracking-wide">
              PROPERTY TYPE
            </div>
            <div className="font-medium">
              {(p as any)?.constructionStatus ?? "—"}
            </div>
          </div>

          <div className="items-center gap-2">
            <Furnishing size={24} color={bgPriceColoricon} />
            <div className="text-xs text-gray-500 tracking-wide">
              FURNISHING
            </div>
            <div className="font-medium">
              {(p as any)?.furnishedStatus?.trim() ?? "—"}
            </div>
          </div>

          <div className="items-center gap-2">
            <Steps size={24} color={bgPriceColoricon} />
            <div className="text-xs text-gray-500 tracking-wide">FLOOR</div>
            <div className="font-medium">
              {p.floorNumber ?? "—"} / {p.totalFloors ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Right: price card */}
      <aside
        className="w-44 md:w-52 p-4 flex flex-col rounded-sm relative"
        style={{ backgroundColor: bgPriceColor }}
      >
        {/* Middle: Price Section (centered vertically + horizontally) */}
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="text-green-600 font-semibold text-2xl ">
            {formatINR(p?.price)}
          </div>

          <div className="text-lg text-gray-700 mt-1">
            ₹ {pricePerSqft} per sqft
          </div>
        </div>

        {/* Bottom: Button */}
        <div className="w-full mt-4">
          <button
            className="w-full bg-green-600 text-white py-2 rounded-md shadow-sm hover:bg-green-700 transition"
            onClick={() => window.alert(`Contact owner for ${p?.title}`)}
          >
            Contact Owner
          </button>
        </div>
      </aside>
    </Link>
  );
};

export default CommercialCard;
