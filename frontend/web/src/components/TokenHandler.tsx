"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Cookies from "js-cookie";

export default function TokenHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    const kyc = searchParams.get("kyc");

    if (token) {
      // store token in cookie
      Cookies.set("token", token, {
        expires: 7,
        sameSite: "lax",
      });

      // remove query params from URL
      router.replace("/");
    }

    if (kyc === "verified") {
      // console.log("KYC Verified Successfully");
    }
  }, [searchParams, router]);

  return null;
}