// app/tenants/[subdomain]/layout.tsx
import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/platform/dashboard/Header";
import { auth } from "@/lib/auth";
import { TenantSidebarManager } from "@/components/tenant/shared/TenantSidebarManager";
import { MobileNavManager } from "@/components/tenant/shared/MobileNavManager";

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
            next: { revalidate: 300 }, // Cache config for 5 minutes
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

    // Route to marketplace/exploration if tenant context handshake fails
    const rootDomain = process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'dsmhgroup.com';

    if (!tenantId) redirect(`https://${rootDomain}/explore`);

    const tenantConfig = await getTenantConfig(tenantId);
    const dynamicPrimaryHsl = hexToHslString(tenantConfig?.themeConfig?.primaryColor || "#ea580c");

    const authData = await auth.api.getSession({ headers: await headers() });
    if (!authData) {
        redirect(`https://${rootDomain}/login`);
    }

    return (
        <div
            className="flex min-h-screen w-full bg-background text-foreground"
            style={{ '--primary': dynamicPrimaryHsl } as React.CSSProperties}
        >
            {/* Structural Sidebar Isolation */}
            <aside className="hidden md:flex w-64 border-r border-border bg-background shrink-0">
                <TenantSidebarManager
                    user={authData.user}
                    tenantId={tenantId}
                    config={tenantConfig}
                />
            </aside>

            {/* Subdomain Content Viewport */}
            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader user={authData.user} />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                    {children}
                </main>
                <MobileNavManager tenantId={tenantId} />
            </div>
        </div>
    );
}