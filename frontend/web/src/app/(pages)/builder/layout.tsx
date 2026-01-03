"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hidePromoOn = [""];

  const shouldShowPromo = !hidePromoOn.includes(pathname);

  return (
    <div className="min-h-screen container mx-auto flex">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6">

        {children}
      </main>
    </div>
  );
}
