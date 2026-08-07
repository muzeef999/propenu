"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
  /\/$/,
  "",
);

/**
 * Invite email landing:
 * 1) track click via API
 * 2) redirect to project selling preview page (or onboard form)
 */
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
        // Prefer JSON resolve endpoint (token-based) for slug + tracking
        const res = await fetch(
          `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "Invite link is invalid or expired");
        }

        // Also mark click via tracking id (best-effort)
        fetch(
          `${apiBase}/api/properties/public/builder-invite/${encodeURIComponent(trackingId)}/click?token=${encodeURIComponent(token)}&to=${encodeURIComponent(to)}`,
          { redirect: "manual", cache: "no-store" },
        ).catch(() => undefined);

        if (cancelled) return;

        const slug = json?.data?.project?.slug;
        if (to === "onboard") {
          router.replace(`/builder/onboard/${encodeURIComponent(token)}`);
          return;
        }

        if (!slug) {
          throw new Error("Project preview is not available for this invite");
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
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-bold text-red-700 mb-2">Invite link issue</h1>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <a
            href="/"
            className="inline-block rounded-xl bg-[#27AE60] px-4 py-2 text-sm font-semibold text-white"
          >
            Go Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-[#27AE60]" />
        <p className="text-sm font-semibold text-gray-700">
          Opening your project preview…
        </p>
      </div>
    </main>
  );
}
