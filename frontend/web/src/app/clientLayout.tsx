"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { store } from "@/Redux/store";


export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create the client once per browser session
  const [queryClient] = React.useState(() => new QueryClient());

  return (
     <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    </Provider>
  );
}
