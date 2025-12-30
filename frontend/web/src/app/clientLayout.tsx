"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { store } from "@/Redux/store";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";


export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create the client once per browser session
  const [queryClient] = React.useState(() => new QueryClient());

     const pathname = usePathname(); // 👈 get current path

  const hideFooter = pathname?.startsWith("/featured"); 
  const hideNavbar = pathname?.startsWith("/postproperty");

  return (
     <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      {!hideNavbar && <Navbar />}
      {children}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        duration={3000} />
         {!hideFooter && <Footer />}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    </Provider>
  );
}
