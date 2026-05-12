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
      className="relative mt-4 min-h-[220px] overflow-hidden rounded-xl border border-[#d6efdf] px-4 py-5 sm:min-h-[250px] sm:px-6 sm:py-6 lg:min-h-[276px] lg:px-10 lg:py-7" 
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

      <div className="relative z-10 grid min-h-[180px] items-center gap-5 sm:min-h-[200px] sm:grid-cols-[minmax(0,1fr)_300px] lg:min-h-[220px] lg:grid-cols-[minmax(300px,1fr)_330px_350px] lg:gap-6">
        <div className="mx-auto max-w-[300px] text-center sm:mx-0 sm:max-w-[360px] sm:text-left lg:max-w-[430px]">
          <h3 className="text-lg font-semibold leading-tight text-[#1eae5f] sm:text-[22px] lg:text-[26px]">
            Built for Better Home Hunting Coming Soon
          </h3>
          <p className="mx-auto mt-2.5 max-w-[280px] text-xs leading-5 text-gray-500 sm:mx-0 sm:mt-3 sm:max-w-[340px] sm:text-sm lg:mt-4 lg:max-w-[390px] lg:text-[15px] lg:leading-6">
            Soon you will be able to explore properties directly listed by
            owners{city ? ` in ${city}` : ""} with better deals and no middlemen.
          </p>

          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-[#27AE60] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#219653] sm:mt-5 sm:h-9 sm:px-6 sm:text-sm lg:mt-6 lg:h-10 lg:px-8"
          >
            <HiOutlineBell className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
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

        <div className="relative mx-auto w-full max-w-[300px] rounded-[18px] bg-white px-4 py-3 shadow-sm sm:max-w-[300px] lg:max-w-[350px] lg:rounded-[22px] lg:px-5 lg:py-4">
          <span className="absolute -left-3 top-[52px] h-6 w-6 rounded-full bg-[#cfefdc]" />
          <span className="absolute -right-3 top-[52px] h-6 w-6 rounded-full bg-[#c1ead2]" />
          <span className="absolute -left-3 bottom-[62px] h-6 w-6 rounded-full bg-[#cfefdc]" />
          <span className="absolute -right-3 bottom-[62px] h-6 w-6 rounded-full bg-[#c1ead2]" />

          <div className="flex items-start gap-3 border-b border-dashed border-gray-200 pb-2.5 lg:pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#27AE60]/20 text-[#27AE60] lg:h-10 lg:w-10">
              <TbHomeDollar className="h-5 w-5 lg:h-6 lg:w-6" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-800 lg:text-sm">
                Be the first to list your Property
              </p>
              <p className="mt-1 text-[11px] text-gray-400 lg:text-xs">
                Sell / Rent Faster with Propenu
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-dashed border-gray-200 text-[11px] lg:text-xs">
            <div className="flex items-center gap-1.5 py-2.5 text-[#0088a8] lg:py-3">
              <MdOutlineVerifiedUser className="h-4 w-4" />
              Verified Users
            </div>
            <div className="flex items-center justify-center bg-[#f7fff4] px-2 py-2.5 text-center text-[#5e9f20] lg:py-3">
              Zero Spam Experience
            </div>
          </div>

          <div className="border-b border-dashed border-gray-200 py-2.5 lg:py-3">
            <span className="inline-flex items-center gap-1.5 bg-[#fffdf5] px-2 py-1 text-[11px] text-[#b89400] lg:text-xs">
              <MdSupportAgent className="h-4 w-4" />
              End to End Support
            </span>
          </div>

          <Link
            href="/postproperty"
            className="mt-3 flex h-8 items-center justify-center rounded border border-[#27AE60] text-xs font-semibold text-[#27AE60] transition hover:bg-[#27AE60] hover:text-white lg:mt-4 lg:h-9 lg:text-sm"
          >
            Post Property
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerComingSoon;
