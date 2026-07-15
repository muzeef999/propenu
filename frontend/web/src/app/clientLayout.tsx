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
import { HomeMateChatbot } from "@/app/(pages)/chatbot";
import { ModalProvider, useModal } from "@/app/context/ModalContext";
import { getFcmToken } from "@/utilies/getFcmToken";

const HIDE_LAYOUT_ROUTES = [
  "/prime",
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
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { isAgentRegistrationModalOpen } = useModal();

  const hideLayout = HIDE_LAYOUT_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await me();
        setUser(data);
        if (data?.user) {
          localStorage.setItem("role", data.user.roleName || "user");
          localStorage.setItem("userId", data.user.id || data.user._id || "");
          localStorage.setItem("name", data.user.name || "");
          localStorage.setItem("email", data.user.email || "");
        }
      } catch (e) {
        // ignore
      }
    }

    fetchUser();

    const handleAuthChanged = () => {
      fetchUser();
    };

    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, []);


  useEffect(() => {
  if (!user?.user?.id) return; // ⛔ WAIT for user

  const initPush = async () => {
    const token = await getFcmToken();


    if (!token) return;

    const userId = user.user.id;


    await sendTokenToBackend(userId, token);
  };

  initPush();
}, [user]); // ✅ DEPENDENCY FIX

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
      {!hideLayout && !isAgentRegistrationModalOpen && (
        <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
          <HomeMateChatbot
            isOpen={isChatbotOpen}
            onOpen={() => setIsChatbotOpen(true)}
            onClose={() => setIsChatbotOpen(false)}
          />
        </div>
      )}
         {!hideLayout && <Footer />}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    </Provider>
  );
}
