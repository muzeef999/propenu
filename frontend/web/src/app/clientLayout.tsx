"use client";

import React from "react";
import { useEffect, useState } from "react";
import { me } from "@/data/ClientData";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { store } from "@/Redux/store";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ModalProvider, useModal } from "@/app/context/ModalContext";

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
  return (
    <ModalProvider>
      <ClientProvidersContent>{children}</ClientProvidersContent>
    </ModalProvider>
  );
}

function ClientProvidersContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create the client once per browser session
  const [queryClient] = React.useState(() => new QueryClient());

  const pathname = usePathname(); // 👈 get current path
  const [user, setUser] = useState<any>(null);
  const { isAgentRegistrationModalOpen } = useModal();

  const hideLayout = HIDE_LAYOUT_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await me();
        setUser(data);
      } catch (e) {
        // ignore
      }
    }
    fetchUser();
  }, []);

  return (
     <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      {!hideLayout && !isAgentRegistrationModalOpen && <Navbar />}
      {children}
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
