"use client";

import { ReactNode } from "react";

/** Email-client framed shell — looks like continuing inside the invite email */
export default function EmailOnboardingShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#eef1f4] px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-[720px]">
        {/* Fake email chrome */}
        <div className="mb-3 flex items-center gap-2 px-1 text-[11px] font-semibold text-gray-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#27AE60]" />
          Inbox · Propenu Launch Partner Invite
        </div>

        <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between border-b border-gray-100 bg-[#f8faf9] px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#27AE60] text-sm font-black text-white">
                P
              </div>
              <div>
                <p className="text-sm font-black tracking-wide text-[#0f172a]">
                  PROPENU
                </p>
                <p className="text-[10px] font-semibold text-gray-500">
                  Simplify. Connect. Grow.
                </p>
              </div>
            </div>
            <p className="hidden text-[10px] font-bold uppercase tracking-widest text-[#27AE60] sm:block">
              Inside email experience
            </p>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-7">{children}</div>

          <div className="border-t border-gray-100 bg-[#f8faf9] px-5 py-4 text-center">
            <p className="text-xs font-bold text-[#0f172a]">
              All steps continue in this invite experience
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              No separate dashboard login required to finish approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
