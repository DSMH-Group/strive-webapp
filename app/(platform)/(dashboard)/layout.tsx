// app/(platform)/(dashboard)/layout.tsx
import React from "react";
import { LayoutDashboard, Search, Wallet, Settings } from "lucide-react";
import { Sidebar } from "@/components/platform/dashboard/Sidebar";
import { DashboardHeader } from "@/components/platform/dashboard/Header";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}) {
    // 1. Centralized Authentication Check
    const authData = await auth.api.getSession({ headers: await headers() });

    if (!authData) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r border-border bg-background sticky top-0 h-screen">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader user={authData.user} />
                <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-t border-border flex items-center justify-around px-6 z-50">
                <MobileNavItem icon={<LayoutDashboard size={20} />} label="Home" active />
                <MobileNavItem icon={<Search size={20} />} label="Discover" />
                <MobileNavItem icon={<Wallet size={20} />} label="Wallet" />
                <MobileNavItem icon={<Settings size={20} />} label="Settings" />
            </nav>
        </div>
    );
}

// System-Compliant Mobile Nav Item Link
function MobileNavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
        </div>
    );
}