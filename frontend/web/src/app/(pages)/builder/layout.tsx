"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  // Invite/onboard must feel like continuing inside the email — no builder sidebar
  const isInviteExperience =
    pathname.startsWith("/builder/onboard") ||
    pathname.startsWith("/builder/invite");

  if (isInviteExperience) {
    return <div className="min-h-screen bg-[#eef1f4]">{children}</div>;
  }

  return (
    <div className="container mx-auto mb-4 min-h-screen lg:flex lg:items-start">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-24 sm:p-4 lg:p-6 lg:pb-6">
        {children}
      </main>
    </div>
  );
}
