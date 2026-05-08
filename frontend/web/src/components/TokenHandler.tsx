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
    const remark = searchParams.get("remark");

    if (token && (kyc === "verified" || kyc === "rejected" || kyc === "pending")) {
      Cookies.set("token", token, {
        expires: 7,
        sameSite: "lax",
        path: "/",
      });

      window.dispatchEvent(new Event("auth-changed"));
    }

    if (token && kyc === "verified") {
      router.replace("/");
      return;
    }

    if (kyc === "rejected" || kyc === "pending") {
      sessionStorage.setItem("kycStatus", kyc);

      if (remark) {
        sessionStorage.setItem("kycRemark", remark);
      } else {
        sessionStorage.removeItem("kycRemark");
      }

      window.dispatchEvent(
        new CustomEvent("kyc-result", {
          detail: {
            status: kyc,
            remark: remark || "",
          },
        }),
      );

      router.replace("/");
    }
  }, [searchParams, router]);

  return null;
}
