import ArrowSvgTestominal from "@/svg/ArrowSvgTestominal";
import TestmonialVideosHome from "./TestmonialVideosHome";
import ClientStories from "./ClientStories";

const TestomianalHome = () => {
  return (
    <section className="py-10">
      {/* Top grid: left text + right videos */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
        {/* Left Section */}
        <div className="flex flex-col justify-center items-start space-y-6 px-4">
          <div className="w-[20%]">
            <ArrowSvgTestominal />
          </div>

          <p className="text-4xl md:text-5xl font-light leading-tight">
            Real Voices for families who made
            <span className="font-bold text-primary text-5xl md:text-6xl">
              {" "}
              HYDERABAD{" "}
            </span>
            their forever home
          </p>

          <button className="btn btn-primary px-6 py-3 text-lg">
            Explore More
          </button>
        </div>

        {/* Right Section (Videos) */}
        <div className="relative z-0 w-full h-[400px] md:h-[600px] flex justify-center">
          <TestmonialVideosHome />
        </div>
      </div>

      {/* Bottom: curve + quote section (full width) */}
      <div>
        <ClientStories />
      </div>
    </section>
  );
};

export default TestomianalHome;
