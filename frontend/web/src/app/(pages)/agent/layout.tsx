"use client";

import Sidebar from "./Sidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen container mx-auto flex flex-col lg:flex-row mb-4">
      <Sidebar />

      <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
    </div>
  );
}
