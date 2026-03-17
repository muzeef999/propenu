"use client";

import React from "react";
import { useEffect, useState } from "react";
import { me, sendTokenToBackend } from "@/data/ClientData";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { store } from "@/Redux/store";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ModalProvider, useModal } from "@/app/context/ModalContext";
import { getFcmToken } from "@/utilies/getFcmToken";

const HIDE_LAYOUT_ROUTES = [
  "/featured",
  "/postproperty",
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


    useEffect(() => {
    const initPush = async () => {
      const token = await getFcmToken();

      if (token) {
        // ⚠️ replace with actual logged-in user ID
        const userId = "69b51f917a772ff246ec8f78";

        await sendTokenToBackend(userId, token);
      }
    };

    initPush();
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
