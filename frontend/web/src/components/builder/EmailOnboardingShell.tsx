"use client";

import { ReactNode } from "react";

export default function EmailOnboardingShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-6">
      <div className="w-full max-w-[720px]">{children}</div>
    </div>
  );
}
