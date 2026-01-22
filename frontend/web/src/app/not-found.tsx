import Error404 from "@/svg/Error404";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "404 – Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
 
        <div className="px-2 py-12 min-h-screen flex items-center justify-center">
          <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 items-center text-center md:text-left">
            
            {/* LEFT CONTENT */}
            <div>
              <h1 className="text-4xl font-bold text-[#0B3D2E]">
                Ooops…
              </h1>
              <p className="mt-4 text-lg text-gray-700">
                You’ve wandered a bit too far.
              </p>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto md:mx-0">
                We couldn’t find the page you’re looking for. Let’s head back to the
                main site and start over.
              </p>
              <Link
                href="/"
                className="inline-flex mt-6 items-center justify-center rounded-md bg-[#27AE60] px-6 py-3 text-sm font-semibold text-white shadow hover:bg-[#219653] transition"
              >
                Take Me Home
              </Link>
            </div>

            {/* RIGHT ILLUSTRATION */}
            <div className="flex justify-center md:justify-start max-w-sm w-full mx-auto">
              <Error404  />
            </div>
          </div>
        </div>
 
  );
}
