"use client";
export const dynamic = "force-dynamic";

import TestomianalHome from "./(pages)/reviews/TestomianalHome";
import ExploreMorePropertiesPage from "./(pages)/explore-properties/Explore-properties";
import SearchBox from "@/components/SearchBox";
import ExploreOurServices from "@/app/(pages)/explore-properties/ExploreOurServices";
import FeaturedProjectsClient from "./(pages)/featured/FeaturedProjectsClient";
import HighlightProjectsClient from "./(pages)/highlight-projects/HighlightProjectsClient";
import AgentsList from "./(pages)/agent-connect/AgentCard";
import PopularOwnerPropertiesClient from "./(pages)/owner-listed/PopularOwnerPropertiesClient";
import Banner from "@/components/Banner";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Cookies from "js-cookie";


export default function Home() {


   const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const kyc = searchParams.get("kyc");

    if (token) {
      // store token in cookie
      Cookies.set("token", token, {
        expires: 7,
        sameSite: "lax",
      });

      // clean URL (remove token from address bar)
      window.history.replaceState({}, "", "/");
    }

    if (kyc === "verified") {
      console.log("KYC Verified Successfully");
    }
  }, [searchParams]);

  return (
    <div>
      <Banner />
      <br />
      <br />
      <div className="container mx-auto  space-y-10">
        <FeaturedProjectsClient />
        <HighlightProjectsClient />
        <PopularOwnerPropertiesClient />
        <AgentsList />
        <ExploreOurServices />
        <ExploreMorePropertiesPage />
        <TestomianalHome />
      </div>
    </div>
  );
}
