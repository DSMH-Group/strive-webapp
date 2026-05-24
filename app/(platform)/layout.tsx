// app/(platform)/(dashboard)/layout.tsx
import React from "react";
import { DashboardHeader } from "@/components/platform/dashboard/Header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PlatformDashboardLayout({
                                                        children,
                                                      }: {
  children: React.ReactNode;
}) {
  // Global auth verification check for the main console hub
  const authData = await auth.api.getSession({ headers: await headers() });
  if (!authData) {
    const rootDomain = process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'stride.lk';
    redirect(`http://${rootDomain}/login`);
  }

  return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader user={authData.user} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
          {children}
        </main>
      </div>
  );
}