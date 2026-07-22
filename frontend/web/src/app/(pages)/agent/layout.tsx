"use client";

import Sidebar from "./Sidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto mb-4 min-h-screen lg:flex lg:items-start">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-24 sm:p-4 lg:p-6 lg:pb-6">
        {children}
      </main>
    </div>
  );
}
