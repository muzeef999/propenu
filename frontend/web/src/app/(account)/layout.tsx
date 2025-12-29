"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import PromoBanner from "@/components/PromoBanner";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ❌ Pages where PromoBanner should NOT appear
  const hidePromoOn = [""];

  const shouldShowPromo = !hidePromoOn.includes(pathname);

  return (
    <div className="min-h-screen container mx-auto flex">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6">
        {/* ✅ Promo is controlled here */}
        {shouldShowPromo && <PromoBanner />}

        {children}
      </main>
    </div>
  );
}
