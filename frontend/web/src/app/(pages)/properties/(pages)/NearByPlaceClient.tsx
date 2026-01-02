"use client";

import dynamic from "next/dynamic";

const NearByPlace = dynamic(
  () => import("./NearByPlace"),
  { ssr: false }
);

export default NearByPlace;
