
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Tell Turbopack where your monorepo root is
  turbopack: {
    root: path.join(__dirname, "../"), // single levels up 
  },

  // keep your existing flags
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "propenu.s3.eu-north-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

};

export default nextConfig;
