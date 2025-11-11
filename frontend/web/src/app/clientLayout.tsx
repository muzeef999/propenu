"use client";

import React from "react";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import {
  QueryClient,
  QueryClientProvider,

} from "@tanstack/react-query";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />

      {children}
    </QueryClientProvider>
  );
}
