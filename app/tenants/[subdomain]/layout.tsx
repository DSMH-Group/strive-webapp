// app/tenants/[subdomain]/layout.tsx
import React from "react";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {DashboardHeader} from "@/components/platform/dashboard/Header";
import {auth} from "@/lib/auth";
import {TenantSidebarManager} from "@/components/tenant/shared/TenantSidebarManager";
import {MobileNavManager} from "@/components/tenant/shared/MobileNavManager";

export const dynamic = 'force-dynamic';

interface TenantConfigResponse {
    id: string;
    name: string;
    themeConfig: {
        primaryColor: string;
        logoUrl: string;
        themeMode?: "light" | "white" | "warm" | "cool" | "dark" | "midnight" | "navy" | "slate";
        radius?: number;
        fontFamily?: string;
        sidebarTheme?: "default" | "dark" | "brand";
    };
}

async function getTenantConfig(tenantId: string): Promise<TenantConfigResponse | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/v1/tenants/${tenantId}`, {
            headers: {"X-Tenant-ID": tenantId},
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch tenant config:", error);
        return null;
    }
}

function hexToHslString(hex: string): string {
    if (!hex || !/^#?[0-9A-Fa-f]{6}$/i.test(hex)) hex = "#ea580c";
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

export default async function TenantLayout({ children, params }: { children: React.ReactNode, params: Promise<{ subdomain: string }> }) {
    const {subdomain} = await params;
    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id");
    const rootDomain = process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'dsmhgroup.com';

    if (!tenantId) redirect(`https://${rootDomain}/explore`);

    const tenantConfig = await getTenantConfig(tenantId);
    const authData = await auth.api.getSession({headers: reqHeaders});
    if (!authData) redirect(`https://${rootDomain}/login`);

    // --- Database Theme Extraction ---
    const themeParams = tenantConfig?.themeConfig;
    const dynamicPrimaryHsl = hexToHslString(themeParams?.primaryColor || "#ea580c");
    const radius = themeParams?.radius ?? 0.5;
    const activeThemeId = themeParams?.themeMode || "dark";
    const sidebarTheme = themeParams?.sidebarTheme || "default";
    const fontFamily = themeParams?.fontFamily || "sans";

    const fontClassMap: Record<string, string> = {
        sans: "var(--font-sans)",
        poppins: "var(--font-poppins)",
        roboto: "var(--font-roboto)",
        serif: "var(--font-serif)"
    };
    const selectedFont = fontClassMap[fontFamily] || "var(--font-sans)";

    // --- Map Base App Colors ---
    let bg, fg, card, cardFg, popover, popoverFg, sec, secFg, muted, mutedFg, acc, accFg, dest, border, input;

    const isLightMode = ['light', 'white', 'warm', 'cool'].includes(activeThemeId);

    switch (activeThemeId) {
        // ☀️ LIGHT VARIANTS
        case 'light': // Gray tinted body, white cards
            bg = '240 4.8% 95.9%'; fg = '240 10% 3.9%'; card = '0 0% 100%'; cardFg = '240 10% 3.9%'; popover = '0 0% 100%'; popoverFg = '240 10% 3.9%'; sec = '240 4.8% 95.9%'; secFg = '240 5.9% 10%'; muted = '240 4.8% 95.9%'; mutedFg = '240 3.8% 46.1%'; acc = '240 4.8% 95.9%'; accFg = '240 5.9% 10%'; dest = '0 84.2% 60.2%'; border = '240 5.9% 90%'; input = '240 5.9% 90%';
            break;
        case 'white': // Pure white body, pure white cards
            bg = '0 0% 100%'; fg = '240 10% 3.9%'; card = '0 0% 100%'; cardFg = '240 10% 3.9%'; popover = '0 0% 100%'; popoverFg = '240 10% 3.9%'; sec = '240 4.8% 95.9%'; secFg = '240 5.9% 10%'; muted = '240 4.8% 95.9%'; mutedFg = '240 3.8% 46.1%'; acc = '240 4.8% 95.9%'; accFg = '240 5.9% 10%'; dest = '0 84.2% 60.2%'; border = '240 5.9% 90%'; input = '240 5.9% 90%';
            break;
        case 'warm': // Sand/Cream tint
            bg = '40 33% 93%'; fg = '24 10% 15%'; card = '0 0% 100%'; cardFg = '24 10% 15%'; popover = '0 0% 100%'; popoverFg = '24 10% 15%'; sec = '40 20% 88%'; secFg = '24 10% 20%'; muted = '40 20% 88%'; mutedFg = '24 5% 45%'; acc = '40 20% 88%'; accFg = '24 10% 20%'; dest = '0 84.2% 60.2%'; border = '40 20% 85%'; input = '40 20% 85%';
            break;
        case 'cool': // Slate/Ice tint
            bg = '210 40% 96%'; fg = '222 47% 11%'; card = '0 0% 100%'; cardFg = '222 47% 11%'; popover = '0 0% 100%'; popoverFg = '222 47% 11%'; sec = '210 40% 92%'; secFg = '222 47% 15%'; muted = '210 40% 92%'; mutedFg = '215 16% 47%'; acc = '210 40% 92%'; accFg = '222 47% 15%'; dest = '0 84.2% 60.2%'; border = '214 32% 91%'; input = '214 32% 91%';
            break;

        // 🌙 DARK VARIANTS
        case 'midnight': // OLED Pure Black
            bg = '0 0% 0%'; fg = '0 0% 100%'; card = '0 0% 4%'; cardFg = '0 0% 100%'; popover = '0 0% 4%'; popoverFg = '0 0% 100%'; sec = '0 0% 12%'; secFg = '0 0% 100%'; muted = '0 0% 12%'; mutedFg = '0 0% 65%'; acc = '0 0% 15%'; accFg = '0 0% 100%'; dest = '0 62.8% 30.6%'; border = '0 0% 15%'; input = '0 0% 15%';
            break;
        case 'navy': // Deep Slate/Blue
            bg = '222 47% 5%'; fg = '210 40% 98%'; card = '222 47% 7%'; cardFg = '210 40% 98%'; popover = '222 47% 7%'; popoverFg = '210 40% 98%'; sec = '217 33% 17%'; secFg = '210 40% 98%'; muted = '217 33% 17%'; mutedFg = '215 20% 65%'; acc = '217 33% 20%'; accFg = '210 40% 98%'; dest = '0 62.8% 30.6%'; border = '217 33% 20%'; input = '217 33% 20%';
            break;
        case 'slate': // Softer Gray/Blue
            bg = '222 47% 11%'; fg = '210 40% 98%'; card = '222 47% 13%'; cardFg = '210 40% 98%'; popover = '222 47% 13%'; popoverFg = '210 40% 98%'; sec = '217 33% 20%'; secFg = '210 40% 98%'; muted = '217 33% 20%'; mutedFg = '215 20% 65%'; acc = '217 33% 25%'; accFg = '210 40% 98%'; dest = '0 62.8% 30.6%'; border = '217 33% 25%'; input = '217 33% 25%';
            break;
        default: // dark (zinc) default
            bg = '240 10% 3.9%'; fg = '0 0% 98%'; card = '240 10% 5.9%'; cardFg = '0 0% 98%'; popover = '240 10% 4.9%'; popoverFg = '0 0% 98%'; sec = '240 3.7% 15.9%'; secFg = '0 0% 98%'; muted = '240 3.7% 10%'; mutedFg = '240 5% 65%'; acc = '240 3.7% 13%'; accFg = '0 0% 98%'; dest = '0 62.8% 30.6%'; border = '240 3.7% 12%'; input = '240 3.7% 12%';
            break;
    }

    // --- Dynamic Sidebar Overrides ---
    let sidebarCss = '';
    if (sidebarTheme === 'brand') {
        sidebarCss = `
            #tenant-sidebar, #tenant-mobile-nav {
                --background: ${dynamicPrimaryHsl};
                --foreground: 0 0% 100%;
                --border: ${dynamicPrimaryHsl};
                --muted: ${dynamicPrimaryHsl};
                --muted-foreground: 0 0% 90%;
                --accent: 0 0% 100%;
                --accent-foreground: ${dynamicPrimaryHsl};
                --primary: 0 0% 100%;
                --primary-foreground: ${dynamicPrimaryHsl};
            }
        `;
    } else if (sidebarTheme === 'dark' || (sidebarTheme === 'default' && isLightMode)) {
        // 🚀 FIXED: Now correctly checks if the base app is ANY of the 4 light themes
        sidebarCss = `
            #tenant-sidebar, #tenant-mobile-nav {
                --background: 240 10% 3.9%;
                --foreground: 0 0% 98%;
                --border: 240 3.7% 12%;
                --muted: 240 3.7% 10%;
                --muted-foreground: 240 5% 65%;
                --accent: 240 3.7% 13%;
                --accent-foreground: 0 0% 98%;
                --primary: ${dynamicPrimaryHsl};
                --primary-foreground: 0 0% 100%;
            }
        `;
    }

    const injectedThemeCSS = `
        :root {
            --background: ${bg};
            --foreground: ${fg};
            --card: ${card};
            --card-foreground: ${cardFg};
            --popover: ${popover};
            --popover-foreground: ${popoverFg};
            --primary: ${dynamicPrimaryHsl};
            --primary-foreground: ${isLightMode ? '0 0% 98%' : '0 0% 100%'};
            --secondary: ${sec};
            --secondary-foreground: ${secFg};
            --muted: ${muted};
            --muted-foreground: ${mutedFg};
            --accent: ${acc};
            --accent-foreground: ${accFg};
            --destructive: ${dest};
            --destructive-foreground: 0 0% 98%;
            --border: ${border};
            --input: ${input};
            --ring: ${dynamicPrimaryHsl};
            --radius: ${radius}rem;
        }

        /* 🚀 Injects Sidebar CSS Isolation */
        ${sidebarCss}

        body, * {
            font-family: ${selectedFont}, sans-serif !important;
        }
        body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
        }
    `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: injectedThemeCSS }} />

            <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
                <aside id="tenant-sidebar" className="hidden md:flex w-64 h-full border-r border-border bg-background shrink-0 transition-colors duration-300">
                    <TenantSidebarManager tenantId={tenantId} config={tenantConfig} />
                </aside>

                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    <DashboardHeader user={authData.user}/>

                    <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
                        <div className="max-w-7xl mx-auto w-full">
                            {children}
                        </div>
                    </main>

                    <div id="tenant-mobile-nav" className="md:hidden shrink-0 border-t border-border bg-background transition-colors duration-300">
                        <MobileNavManager tenantId={tenantId} user={authData.user} config={tenantConfig}/>
                    </div>
                </div>
            </div>
        </>
    );
}