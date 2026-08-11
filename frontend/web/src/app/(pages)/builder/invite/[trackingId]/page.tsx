"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import EmailOnboardingShell from "@/components/builder/EmailOnboardingShell";
import ProjectLoadingSkeleton from "@/components/project/ProjectLoadingSkeleton";

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
  /\/$/,
  "",
);

export default function BuilderInviteClickPage() {
  const params = useParams<{ trackingId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const trackingId = String(params?.trackingId || "");
    const token = String(search.get("token") || "");
    const to = String(search.get("to") || "preview");

    if (!trackingId || !token) {
      setError("Invalid invite link.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "Invite link is invalid or expired");
        }

        fetch(
          `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(trackingId)}/click?token=${encodeURIComponent(token)}&to=${encodeURIComponent(to)}`,
          { redirect: "manual", cache: "no-store" },
        ).catch(() => undefined);

        if (cancelled) return;

        const slug = json?.data?.project?.slug;
        if (!slug) {
          throw new Error("Project preview is unavailable for this invite");
        }

        router.replace(
          `/project/${encodeURIComponent(slug)}?invite=${encodeURIComponent(token)}`,
        );
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to open invite");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params?.trackingId, search, router]);

  if (error) {
    return (
      <EmailOnboardingShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-2 text-lg font-bold text-red-700">
            Invite link issue
          </h1>
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <a
            href="/"
            className="inline-block rounded-xl bg-[#27AE60] px-4 py-2 text-sm font-semibold text-white"
          >
            Go Home
          </a>
        </div>
      </EmailOnboardingShell>
    );
  }

  return (
    <ProjectLoadingSkeleton />
  );
}
