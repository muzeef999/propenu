"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

function ApprovePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const propertyId = params?.id as string | undefined;
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  const [message, setMessage] = useState("Approving property...");

  useEffect(() => {
    if (!propertyId || !token) {
      setStatus("error");
      setMessage("❌ Invalid approval link");
      return;
    }

    approveProperty();
  }, [propertyId, token]);

  async function approveProperty() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/properties/residential/${propertyId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Approval failed");
      }

      setStatus("success");
      setMessage("✅ Property Approved Successfully!");
    } catch (err: any) {
      console.error("❌ Approval Error:", err);
      setStatus("error");
      setMessage(err.message || "Something went wrong");
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>🏠 Property Approval</h1>

      {status === "loading" && (
        <p>⏳ Approving property... please wait</p>
      )}

      {status === "success" && (
        <p style={{ color: "green" }}>{message}</p>
      )}

      {status === "error" && (
        <p style={{ color: "red" }}>{message}</p>
      )}
    </div>
  );
}


export default function ApprovePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: "Arial" }}>Approving property...</div>}>
      <ApprovePageContent />
    </Suspense>
  );
}
