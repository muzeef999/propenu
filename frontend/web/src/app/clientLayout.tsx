"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import Footer, { FooterLegalBar } from "@/components/Footer";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ModalProvider, useModal } from "@/app/context/ModalContext";
import { me, sendTokenToBackend } from "@/data/ClientData";
import { store } from "@/Redux/store";
import { getFcmToken } from "@/utilies/getFcmToken";

const HIDE_LAYOUT_ROUTES = [
  "/prime",
  "/postproperty",
  "/builder/onboard",
  "/builder/invite",
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
  const [queryClient] = React.useState(() => new QueryClient());

  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [hasOpenDialog, setHasOpenDialog] = useState(false);
  const { isAgentRegistrationModalOpen } = useModal();

  const hideLayout = HIDE_LAYOUT_ROUTES.some((route) =>
    pathname?.startsWith(route),
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
      } catch {
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
    if (!user?.user?.id) return;

    const initPush = async () => {
      const token = await getFcmToken();
      if (!token) return;

      await sendTokenToBackend(user.user.id, token);
    };

    initPush();
  }, [user]);

  useEffect(() => {
    const syncDialogState = () => {
      const dialogCandidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"][aria-modal="true"], [aria-modal="true"]',
        ),
      );

      const hasVisibleDialog = dialogCandidates.some((element) => {
        if (element.getAttribute("aria-hidden") === "true") {
          return false;
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          rect.width > 0 &&
          rect.height > 0
        );
      });

      setHasOpenDialog(hasVisibleDialog);
    };

    syncDialogState();

    const observer = new MutationObserver(syncDialogState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "data-state", "aria-hidden", "aria-modal"],
    });

    window.addEventListener("resize", syncDialogState);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncDialogState);
    };
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {!hideLayout && !isAgentRegistrationModalOpen && <Navbar />}
        <div className={!hideLayout ? "pb-20 lg:pb-0" : undefined}>{children}</div>
        {!hideLayout && !isAgentRegistrationModalOpen && (
          <MobileBottomNav
            isAuthenticated={Boolean(user?.user)}
            isDialogOpen={hasOpenDialog}
          />
        )}
        <FloatingWhatsAppButton />
        <Toaster
          position="top-right"
          richColors
          expand={true}
          duration={3000}
        />
        <div className="hidden lg:block">
          {!hideLayout ? <Footer /> : <FooterLegalBar />}
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  );
}
