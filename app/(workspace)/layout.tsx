// app/(workspace)/layout.tsx
import React from "react";
import SidebarServer from "@/components/SidebarServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-black text-white relative">
      <SidebarServer />
      <div className="flex-1 min-h-screen">
        {children}
      </div>
    </div>
  );
}