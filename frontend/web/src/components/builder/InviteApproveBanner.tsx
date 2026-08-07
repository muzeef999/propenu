"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function InviteApproveBanner({
  projectTitle,
}: {
  projectTitle?: string;
}) {
  const search = useSearchParams();
  const inviteToken = search.get("invite");

  if (!inviteToken) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-emerald-200 bg-emerald-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
            Propenu Launch Partner Invite
          </p>
          <p className="text-sm font-semibold text-gray-800">
            Review {projectTitle ? `“${projectTitle}”` : "this project"} preview,
            then click Approve to add contact details and complete onboarding.
          </p>
        </div>
        <Link
          href={`/builder/onboard/${encodeURIComponent(inviteToken)}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#27AE60] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#219150]"
        >
          Approve
        </Link>
      </div>
    </div>
  );
}
