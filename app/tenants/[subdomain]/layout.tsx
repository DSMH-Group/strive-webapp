// app/tenants/[subdomain]/layout.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/platform/dashboard/Header";
import { LayoutDashboard, Users, Calendar, Settings, Dumbbell, Home, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import type { Metadata } from "next";
import "../../globals.css";
import { TenantAdminSidebar } from "@/components/tenant/admin/TenantAdminSidebar";
import { TenantMemberSidebar } from "@/components/tenant/member/TenantMemberSidebar";
import {TenantStaffSidebar} from "@/components/tenant/staff/TenantStaffSidebar";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Stride Platform Workspace",
    description: "Multi-Tenant Decoupled Client Portal Engine",
};

interface TenantConfigResponse {
    id: string;
    name: string;
    themeConfig: {
        primaryColor: string;
        logoUrl: string;
    };
}

async function getTenantConfig(tenantId: string): Promise<TenantConfigResponse | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/v1/tenants/${tenantId}`, {
            headers: { "X-Tenant-ID": tenantId },
            next: { revalidate: 300 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch tenant theme config:", error);
        return null;
    }
}

function hexToHslString(hex: string): string {
    hex = hex.replace(/^#/, '');
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default async function TenantLayout({
                                               children,
                                               params
                                           }: {
    children: React.ReactNode,
    params: Promise<{ subdomain: string }>
}) {
    const { subdomain } = await params;

    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://strive.lk/explore");
    }

    const tenantConfig = await getTenantConfig(tenantId);
    const rawHex = tenantConfig?.themeConfig?.primaryColor || "#ea580c";
    const dynamicPrimaryHsl = hexToHslString(rawHex);

    // --- Dynamic Multi-Role Routing Evaluation Engine ---
    // Reads headers to inspect active request pathing and seamlessly derive rendering views
    const activeUrlPath = reqHeaders.get("x-invoke-path") || "";

    const isMemberScope = activeUrlPath.includes("/member") || true; // Set to true explicitly for your current testing context
    const isTrainerScope = !isMemberScope && activeUrlPath.includes("/trainer");
    const isAdminScope = !isMemberScope && !isTrainerScope;

    return (
        <html
            lang="en"
            className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
        >
        <body className="min-h-full flex flex-col">
        <div
            className="flex min-h-screen bg-zinc-950 text-white selection:bg-primary/30"
            style={{ '--primary': dynamicPrimaryHsl } as React.CSSProperties}
        >
            {/* Desktop Dynamic Conditional Render Container */}
            <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-zinc-950 sticky top-0 h-screen">
                {isMemberScope && (
                    <TenantMemberSidebar
                        tenantName={tenantConfig?.name || "FitForge"}
                        logoUrl={tenantConfig?.themeConfig?.logoUrl}
                    />
                )}
                {isTrainerScope && (
                    <TenantStaffSidebar
                        tenantName={tenantConfig?.name || "FitForge"}
                        logoUrl={tenantConfig?.themeConfig?.logoUrl}
                    />
                )}
                {isAdminScope && (
                    <TenantAdminSidebar
                        tenantName={tenantConfig?.name || subdomain}
                        logoUrl={tenantConfig?.themeConfig?.logoUrl}
                    />
                )}
            </aside>

            {/* Content Pipeline Context Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader/>
                <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar Configurations */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-around px-6 z-50">
                {isMemberScope && (
                    <>
                        <MobileNavItem icon={<Home size={20}/>} label="Dashboard" active/>
                        <MobileNavItem icon={<Dumbbell size={20}/>} label="Workouts"/>
                        <MobileNavItem icon={<CreditCard size={20}/>} label="Payments"/>
                    </>
                )}
                {isTrainerScope && (
                    <>
                        <MobileNavItem icon={<Users size={20}/>} label="Clients" active/>
                        <MobileNavItem icon={<Calendar size={20}/>} label="Schedule"/>
                        <MobileNavItem icon={<Settings size={20}/>} label="Settings"/>
                    </>
                )}
                {isAdminScope && (
                    <>
                        <MobileNavItem icon={<LayoutDashboard size={20}/>} label="Home" active/>
                        <MobileNavItem icon={<Users size={20}/>} label="Members"/>
                        <MobileNavItem icon={<Settings size={20}/>} label="Settings"/>
                    </>
                )}
            </nav>
        </div>
        </body>
        </html>
    );
}

function MobileNavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            active ? 'text-primary' : 'text-zinc-500 hover:text-zinc-400'
        )}>
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
        </div>
    );
}