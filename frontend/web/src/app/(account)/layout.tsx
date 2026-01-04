"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Sidebar from "./Sidebar";
import PromoBanner from "@/components/PromoBanner";
import ResponsesDrawer from "./ResponsesDrawer";
import { ResponsesProvider } from "./ResponsesContext";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [openResponses, setOpenResponses] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const hidePromoOn = [""];
  const shouldShowPromo = !hidePromoOn.includes(pathname);

  return (
    <div className="min-h-screen container mx-auto flex relative">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RESPONSES DRAWER (SIDEBAR SIZE) */}
      <ResponsesDrawer
        open={openResponses}
        projectId={activeProjectId}
        onClose={() => setOpenResponses(false)}
      />

      {/* Provide responses state to nested pages/components */}
      <ResponsesProvider
        value={{
          openResponses,
          setOpenResponses,
          activeProjectId,
          setActiveProjectId,
        }}
      >
        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-6 relative">
          {shouldShowPromo && <PromoBanner />}

          {children}
        </main>
      </ResponsesProvider>
    </div>
  );
}
