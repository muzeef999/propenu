import Image from "next/image";
import Link from "next/link";
import { HiOutlineBell } from "react-icons/hi2";
import { MdOutlineVerifiedUser, MdSupportAgent } from "react-icons/md";
import { TbHomeDollar } from "react-icons/tb";

type OwnerComingSoonProps = {
  city?: string;
};

const OwnerComingSoon = ({ city }: OwnerComingSoonProps) => {
  return (
    <div
      className="relative min-h-[276px] overflow-hidden rounded-xl border border-[#d6efdf] px-6 py-7 sm:px-8 lg:px-10 mt-4" 
      style={{
        background:
          "linear-gradient(231.95deg, rgba(241, 252, 245, 0.84) 55.66%, rgba(255, 255, 255, 0.84) 104.47%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-l from-[#27AE60]/25 via-[#27AE60]/10 to-transparent" />

      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 12% 18%, transparent 0 34px, rgba(39, 174, 96, 0.18) 35px, transparent 36px), radial-gradient(ellipse at 42% 55%, transparent 0 48px, rgba(39, 174, 96, 0.14) 49px, transparent 50px), radial-gradient(ellipse at 30% 12%, transparent 0 62px, rgba(39, 174, 96, 0.1) 63px, transparent 64px)",
          backgroundSize: "180px 90px, 260px 130px, 300px 160px",
        }}
      />

      <div className="relative z-10 grid min-h-[220px] items-center gap-6 lg:grid-cols-[minmax(300px,1fr)_330px_350px]">
        <div className="max-w-[430px]">
          <h3 className="text-[26px] font-semibold leading-tight text-[#1eae5f] sm:text-[30px]">
            Built for Better Home Hunting Coming Soon
          </h3>
          <p className="mt-4 max-w-[390px] text-sm leading-6 text-gray-500 sm:text-base">
            Soon you will be able to explore properties directly listed by
            owners{city ? ` in ${city}` : ""} with better deals and no middlemen.
          </p>

          <button
            type="button"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-[#27AE60] px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-[#219653]"
          >
            <HiOutlineBell className="h-4 w-4" />
            Get Notified
          </button>
        </div>

        <div className="relative hidden h-[60px] lg:block">
          <Image
            src="/images/ownerlisting.png"
            alt=""
            fill
            className="object-contain object-bottom scale-[4.9] translate-x-[-60%] translate-y-[10%]"
            sizes="400px"
            priority={false}
          />
        </div>

        <div className="relative mx-auto w-full max-w-[350px] rounded-[22px] bg-white px-5 py-4 shadow-sm">
          <span className="absolute -left-3 top-[52px] h-6 w-6 rounded-full bg-[#cfefdc]" />
          <span className="absolute -right-3 top-[52px] h-6 w-6 rounded-full bg-[#c1ead2]" />
          <span className="absolute -left-3 bottom-[62px] h-6 w-6 rounded-full bg-[#cfefdc]" />
          <span className="absolute -right-3 bottom-[62px] h-6 w-6 rounded-full bg-[#c1ead2]" />

          <div className="flex items-start gap-3 border-b border-dashed border-gray-200 pb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#27AE60]/20 text-[#27AE60]">
              <TbHomeDollar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                Be the first to list your Property
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Sell / Rent Faster with Propenu
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-dashed border-gray-200 text-xs">
            <div className="flex items-center gap-1.5 py-3 text-[#0088a8]">
              <MdOutlineVerifiedUser className="h-4 w-4" />
              Verified Users
            </div>
            <div className="flex items-center justify-center bg-[#f7fff4] px-2 py-3 text-[#5e9f20]">
              Zero Spam Experience
            </div>
          </div>

          <div className="border-b border-dashed border-gray-200 py-3">
            <span className="inline-flex items-center gap-1.5 bg-[#fffdf5] px-2 py-1 text-xs text-[#b89400]">
              <MdSupportAgent className="h-4 w-4" />
              End to End Support
            </span>
          </div>

          <Link
            href="/postproperty"
            className="mt-4 flex h-9 items-center justify-center rounded border border-[#27AE60] text-sm font-semibold text-[#27AE60] transition hover:bg-[#27AE60] hover:text-white"
          >
            Post Property
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerComingSoon;
