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
      className="relative mt-4 min-h-[248px] overflow-hidden rounded-xl border border-[#d6efdf] px-4 py-5 sm:min-h-[286px] sm:px-6 sm:py-6 lg:min-h-[318px] lg:px-10 lg:py-8"
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

      <div className="relative z-10 grid min-h-52 items-center gap-5 sm:min-h-[238px] sm:grid-cols-[minmax(0,0.9fr)_minmax(300px,1fr)] lg:min-h-[262px] lg:grid-cols-[minmax(300px,0.92fr)_minmax(360px,1fr)] lg:gap-6">
        <div className="mx-auto max-w-[300px] text-center sm:mx-0 sm:max-w-[360px] sm:text-left lg:max-w-[430px]">
          <h3 className="text-lg font-medium leading-tight text-[#1eae5f] sm:text-[22px] lg:text-[26px]">
            A better way to connect with Agents is on the way
          </h3>
          <p className="mx-auto mt-2.5 max-w-[280px] text-xs leading-5 text-gray-500 sm:mx-0 sm:mt-3 sm:max-w-[340px] sm:text-sm lg:mt-5 lg:max-w-[390px] lg:leading-6 lg:text-[15px]">
            Soon you&apos;ll be able to explore trusted agents in your area with
            verified expertise and faster property decisions.
          </p>

          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#27AE60] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#219653] focus:outline-none focus:ring-2 focus:ring-[#27AE60]/30 sm:mt-5 sm:h-9 sm:px-6 sm:text-sm lg:mt-6 lg:h-10 lg:px-8"
          >
            <HiOutlineBell className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            Get Notified
          </button>
        </div>

        <div className="relative min-h-[150px] sm:min-h-[190px] lg:min-h-[270px]">
          <Image
            src="/images/agentconnect.png"
            alt="Real estate agents"
            fill
            className="translate-x-2 scale-[0.95] object-contain object-bottom sm:translate-x-12 lg:translate-x-20 lg:scale-[1.05]"
            sizes="(min-width: 1024px) 560px, 100vw"
            priority={false}
          />

          <div className="absolute -bottom-2 left-1/2 flex w-[min(100%,300px)] -translate-x-1/2 items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm sm:left-auto sm:right-2 sm:w-[min(100%,340px)] sm:translate-x-0 sm:gap-3 sm:px-4 sm:py-3 lg:-bottom-3 lg:w-[min(100%,410px)] lg:py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#27AE60] text-white lg:h-11 lg:w-11">
              <MdLocationOn className="h-5 w-5 lg:h-7 lg:w-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-5 text-[#27AE60] lg:text-base">
                {location}
              </p>
              <p className="truncate text-[11px] text-gray-400 lg:text-xs">
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
