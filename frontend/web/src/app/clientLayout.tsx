"use client";

import React from "react";
import { useEffect, useState } from "react";
import { me } from "@/data/ClientData";
import { getMyAgentProfile } from "@/app/(pages)/agent/data";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { store } from "@/Redux/store";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import AgentRegistrationModal from "@/app/(pages)/agent/components/AgentRegistrationModal";

const HIDE_LAYOUT_ROUTES = [
  "/featured",
  "/postproperty",
  "/about",
  "/terms",
  "/privacy",
];


export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create the client once per browser session
  const [queryClient] = React.useState(() => new QueryClient());

  const pathname = usePathname(); // 👈 get current path
  const [user, setUser] = useState<any>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);

  const hideLayout = HIDE_LAYOUT_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await me();
        setUser(data);
        
        // Check if user is an agent
        const roleName = data?.user?.roleName || data?.user?.role;
        if (roleName === "agent") {
          // Fetch agent profile status
          const agentProfile = await getMyAgentProfile();
          if (agentProfile?.exists === false) {
            setShowAgentModal(true);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    fetchUser();
  }, []);

  return (
     <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      {!hideLayout && <Navbar />}
      {children}
      {/* Agent registration modal — blocks access until completed */}
      {showAgentModal && (
        <AgentRegistrationModal
          userId={user?.user?.id}
          open={true}
          onCompleted={() => {
            setShowAgentModal(false);
            // refresh to pick up new profile
            window.location.reload();
          }}
        />
      )}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        duration={3000} />
         {!hideLayout && <Footer />}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    </Provider>
  );
}
