import Image from "next/image";
import Link from "next/link";
import { HiArrowRight } from "react-icons/hi2";

export type SponsorCardTarget = "property" | "project";
export type SponsorCardPromotionType =
  | "normal"
  | "featured"
  | "prime"
  | "sponsored";

type SponsoreCardProps = {
  target?: SponsorCardTarget;
  promotionType?: SponsorCardPromotionType | string;
};

const cardCopy: Record<
  SponsorCardTarget,
  Partial<
    Record<
      SponsorCardPromotionType,
      {
        headline: string;
        lines: [string, string, string];
        highlight: string;
        href: string;
        cta: string;
      }
    >
  >
> = {
  property: {
    sponsored: {
      headline: "Show it to Sell it",
      lines: ["The shortest distance", "between 'Listed' and 'Sold'", "is a"],
      highlight: "Sponsored Tag",
      href: "/postproperty",
      cta: "Advertise here",
    },
    featured: {
      headline: "List Higher, Sell Faster",
      lines: ["Put your property", "in front of serious buyers", "with a"],
      highlight: "Featured Tag",
      href: "/postproperty",
      cta: "Feature Property",
    },
  },
  project: {
    sponsored: {
      headline: "Promote Your Project",
      lines: ["Reach buyers searching", "for their next home", "with a"],
      highlight: "Sponsored Project",
      href: "/builder/create-property",
      cta: "Sponsor Project",
    },
    featured: {
      headline: "Become Top Selling",
      lines: ["Bring your project", "closer to active buyers", "with a"],
      highlight: "Top Selling Tag",
      href: "/builder/create-property",
      cta: "Highlight Project",
    },
    prime: {
      headline: "Lead With Prime",
      lines: ["Give your project", "premium buyer visibility", "with a"],
      highlight: "Prime Project Tag",
      href: "/builder/create-property",
      cta: "Go Prime",
    },
  },
};

function normalizePromotionType(
  promotionType?: SponsoreCardProps["promotionType"],
): SponsorCardPromotionType {
  const type = String(promotionType || "sponsored").toLowerCase();

  if (
    type === "normal" ||
    type === "featured" ||
    type === "prime" ||
    type === "sponsored"
  ) {
    return type;
  }

  return "sponsored";
}

const SponsoreCard = ({
  target = "property",
  promotionType = "sponsored",
}: SponsoreCardProps) => {
  const normalizedPromotionType = normalizePromotionType(promotionType);
  const copy =
    cardCopy[target][normalizedPromotionType] ??
    cardCopy[target].sponsored ??
    cardCopy.property.sponsored;

  if (!copy) return null;

  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,255,251,0.96) 42%, rgba(199,239,216,0.95) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 18% 14%, transparent 0 46px, rgba(39,174,96,0.12) 47px, transparent 48px), radial-gradient(ellipse at 44% 66%, transparent 0 58px, rgba(39,174,96,0.12) 59px, transparent 60px), radial-gradient(ellipse at 20% 90%, transparent 0 72px, rgba(39,174,96,0.1) 73px, transparent 74px)",
          backgroundSize: "210px 130px, 260px 170px, 300px 210px",
        }}
      />

      <div className="relative z-10 flex min-h-[560px] flex-col items-center px-6 py-10 text-center">
        <p className="text-[28px] font-extrabold italic leading-tight text-[#27AE60]">
          {copy.headline}
        </p>

        <div className="mt-10 space-y-3 text-[21px] leading-8 text-gray-600">
          <p>{copy.lines[0]}</p>
          <p>
            {copy.lines[1]
              .split(/('Listed'|'Sold')/)
              .map((part) =>
                part === "'Listed'" || part === "'Sold'" ? (
                  <span key={part} className="text-black">
                    &lsquo;{part.slice(1, -1)}&rsquo;
                  </span>
                ) : (
                  part
                ),
              )}
          </p>
          <p>
            {copy.lines[2]}{" "}
            <span className="font-bold text-black">{copy.highlight}</span>
          </p>
        </div>

        <Link
          href={copy.href}
          className="mt-24 inline-flex h-11 w-full max-w-[235px] items-center justify-center gap-2 rounded-md bg-[#27AE60] text-base font-semibold text-white shadow-sm transition hover:bg-[#219653] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/30"
        >
          {copy.cta}
          <HiArrowRight className="h-5 w-5" />
        </Link>

        <div className="relative mt-auto h-36 w-[calc(100%+48px)]">
          <Image
            src="/images/spronsoreCard.png"
            alt=""
            fill
            className="object-contain object-bottom scale-150"
            sizes="280px"
          />
        </div>
      </div>
    </div>
  );
};

export default SponsoreCard;
