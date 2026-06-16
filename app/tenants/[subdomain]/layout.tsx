// app/tenants/[subdomain]/layout.tsx
import React from "react";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {DashboardHeader} from "@/components/platform/dashboard/Header";
import {auth} from "@/lib/auth";
import {TenantSidebarManager} from "@/components/tenant/shared/TenantSidebarManager";
import {MobileNavManager} from "@/components/tenant/shared/MobileNavManager";

// 1. 🚀 UPDATE INTERFACE: Added new theme configurations
interface TenantConfigResponse {
    id: string;
    name: string;
    themeConfig: {
        primaryColor: string;
        logoUrl: string;
        themeMode?: "dark" | "light";
        radius?: number;
        fontFamily?: string;
    };
}

async function getTenantConfig(tenantId: string): Promise<TenantConfigResponse | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/v1/tenants/${tenantId}`, {
            headers: {"X-Tenant-ID": tenantId},
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch tenant theme config:", error);
        return null;
    }
}

function hexToHslString(hex: string): string {
    if (!hex || !/^#?[0-9A-Fa-f]{6}$/i.test(hex)) {
        hex = "#ea580c";
    }

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
    const {subdomain} = await params;
    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id");

    const rootDomain = process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'dsmhgroup.com';

    if (!tenantId) redirect(`https://${rootDomain}/explore`);

    const tenantConfig = await getTenantConfig(tenantId);

    // 2. 🚀 EXTRACT THEME VARIABLES WITH FALLBACKS
    const themeParams = tenantConfig?.themeConfig;
    const dynamicPrimaryHsl = hexToHslString(themeParams?.primaryColor || "#ea580c");
    const radius = themeParams?.radius ?? 0.5;
    const themeMode = themeParams?.themeMode || "dark";
    const fontFamily = themeParams?.fontFamily || "sans";

    const authData = await auth.api.getSession({headers: reqHeaders});
    if (!authData) {
        redirect(`https://${rootDomain}/login`);
    }

    return (
        // 3. 🚀 INJECT CSS CLASSES AND INLINE STYLES FOR FULL RUNTIME CUSTOMIZATION
        <div
            className={`flex h-screen w-full overflow-hidden bg-background text-foreground ${themeMode === 'dark' ? 'dark' : ''} font-${fontFamily}`}
            style={{
                '--primary': dynamicPrimaryHsl,
                '--radius': `${radius}rem`
            } as React.CSSProperties}
        >
            <aside className="hidden md:flex w-64 h-full border-r border-border bg-background shrink-0">
                <TenantSidebarManager
                    tenantId={tenantId}
                    config={tenantConfig}
                />
            </aside>

            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <DashboardHeader user={authData.user}/>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>

                <div className="md:hidden shrink-0 border-t border-border bg-background">
                    <MobileNavManager tenantId={tenantId} user={authData.user} config={tenantConfig}/>
                </div>
            </div>
        </div>
    );
}