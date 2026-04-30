import Image from "next/image";
import { HiOutlineBell } from "react-icons/hi2";
import { MdLocationOn } from "react-icons/md";

type AgentsComingSoonProps = {
  city?: string;
  state?: string;
};

const AgentsComingSoon = ({
  city = "Hyderabad",
  state,
}: AgentsComingSoonProps) => {
  const location = [city, state].filter(Boolean).join(", ");

  return (
    <div
      className="relative mt-4 min-h-[318px] overflow-hidden rounded-xl border border-[#d6efdf] px-6 py-8 sm:px-8 lg:px-10"
      style={{
        background:
          "linear-gradient(101.39deg, rgba(248, 255, 250, 0.96) 0%, rgba(238, 252, 244, 0.96) 48%, rgba(206, 241, 221, 0.96) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 18% 12%, transparent 0 54px, rgba(39, 174, 96, 0.12) 55px, transparent 56px), radial-gradient(ellipse at 30% 62%, transparent 0 70px, rgba(39, 174, 96, 0.1) 71px, transparent 72px), radial-gradient(ellipse at 6% 70%, transparent 0 86px, rgba(39, 174, 96, 0.08) 87px, transparent 88px)",
          backgroundSize: "280px 150px, 360px 180px, 420px 220px",
        }}
      />

      <div className="relative z-10 grid min-h-[262px] items-center gap-6 lg:grid-cols-[minmax(300px,0.92fr)_minmax(360px,1fr)]">
        <div className="max-w-[430px]">
          <h3 className="text-[24px] font-medium leading-tight text-[#1eae5f] sm:text-[30px]">
            A better way to connect with Agents is on the way
          </h3>
          <p className="mt-5 max-w-[390px] text-sm leading-6 text-gray-500">
            Soon you&apos;ll be able to explore trusted agents in your area with
            verified expertise and faster property decisions.
          </p>

          <button
            type="button"
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#27AE60] px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-[#219653] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/30"
          >
            <HiOutlineBell className="h-4 w-4" />
            Get Notified
          </button>
        </div>

        <div className="relative min-h-[210px] lg:min-h-[270px]">
          <Image
            src="/images/agentconnect.png"
            alt="Real estate agents"
            fill
            className="translate-x-20 scale-[1.05] object-contain object-bottom"
            sizes="(min-width: 1024px) 560px, 100vw"
            priority={false}
          />

          <div className="absolute -bottom-3 left-1/2 flex w-[min(100%,410px)] -translate-x-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm sm:left-auto sm:right-2 sm:translate-x-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#27AE60] text-white">
              <MdLocationOn className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-5 text-[#27AE60]">
                {location}
              </p>
              <p className="truncate text-xs text-gray-400">
                Local expertise. Faster connection. Better decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentsComingSoon;
