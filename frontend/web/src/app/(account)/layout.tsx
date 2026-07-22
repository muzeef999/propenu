"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Sidebar from "./Sidebar";
import ResponsesDrawer from "./ResponsesDrawer";
import { ResponsesProvider } from "./ResponsesContext";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openResponses, setOpenResponses] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);


  return (
    <div className="container mx-auto mb-4 min-h-screen lg:flex lg:items-start">
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
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-24 sm:p-4 lg:p-6 lg:pb-6 relative">
          {children}
        </main>
      </ResponsesProvider>
    </div>
  );
}
