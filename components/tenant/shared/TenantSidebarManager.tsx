"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { striveClientFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Users, BarChart3, Settings, LogOut, Loader2,
    ShieldCheck, Home, Dumbbell, TrendingUp, CreditCard, User,
    Calendar, ClipboardSignature
} from "lucide-react";

// --- Types & Interfaces ---

interface SidebarManagerProps {
    tenantId: string;
    config: any;
}

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: number;
    matchExact?: boolean;
}

interface RoleConfig {
    theme: "dark" | "dynamic";
    badgeText: string;
    badgeIcon: React.ReactNode;
    navItems: NavItem[];
}

// --- Configuration Dictionaries ---

const getRoleConfig = (role: string, baseUrl: string, badgeCounts: any = {}): RoleConfig => {
    switch (role) {
        case "ORG_ADMIN":
            return {
                theme: "dark",
                badgeText: "Administrator Access",
                badgeIcon: <ShieldCheck size={14} className="text-primary" />,
                navItems: [
                    { icon: <LayoutDashboard size={18} />, label: "Console", href: `${baseUrl}/console`, matchExact: true },
                    { icon: <Users size={18} />, label: "Members", href: `${baseUrl}/members` },
                    { icon: <Users size={18} />, label: "Invites", href: `${baseUrl}/invites` },
                    { icon: <BarChart3 size={18} />, label: "Reports", href: `${baseUrl}/reports` },
                    { icon: <Settings size={18} />, label: "Settings", href: `${baseUrl}/settings` },
                ]
            };
        case "STAFF":
            return {
                theme: "dark",
                badgeText: "Staff Access",
                badgeIcon: <Dumbbell size={14} className="text-primary" />,
                navItems: [
                    { icon: <Users size={18} />, label: "Clients", href: `${baseUrl}/clients`, matchExact: true, badge: badgeCounts?.clients },
                    { icon: <Calendar size={18} />, label: "Schedule", href: `${baseUrl}/schedule`, badge: badgeCounts?.schedule },
                    { icon: <ClipboardSignature size={18} />, label: "Log", href: `${baseUrl}/log` },
                ]
            };
        default: // MEMBER
            return {
                theme: "dynamic",
                badgeText: "Member Access",
                badgeIcon: <User size={14} className="text-primary" />,
                navItems: [
                    { icon: <Home size={18} />, label: "Overview", href: `${baseUrl}/overview`, matchExact: true },
                    { icon: <Dumbbell size={18} />, label: "Activities", href: `${baseUrl}/activities` },
                    { icon: <TrendingUp size={18} />, label: "Progress", href: `${baseUrl}/progress` },
                    { icon: <CreditCard size={18} />, label: "Payments", href: `${baseUrl}/payments`, badge: badgeCounts?.payments },
                ]
            };
    }
};

// --- Main Manager Component ---

export function TenantSidebarManager({ tenantId, config }: SidebarManagerProps) {
    const { data: userProfile, isLoading, error } = useQuery({
        queryKey: ["sidebarProfileHandshake", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/users/me", { method: "GET" });
            if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
            return await res.json();
        }
    });

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-6 bg-background">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" />
            </div>
        );
    }

    if (error) console.error("[SidebarManager] Sync Error:", error);

    const activeMembership = userProfile?.memberships?.find((m: any) =>
        m.tenantId === tenantId || m.tenant?.id === tenantId
    );

    const roles: string[] = activeMembership?.roles?.map((r: any) => r.role) || [];

    // Resolve highest privilege role
    let activeRole = "MEMBER";
    if (roles.includes("ORG_ADMIN")) activeRole = "ORG_ADMIN";
    else if (roles.includes("MANAGER") || roles.includes("TRAINER")) activeRole = "STAFF";

    const tenantName = config?.name || "Workspace";
    const logoUrl = config?.themeConfig?.logoUrl;

    // In a real scenario, base URLs would adapt to the subdomain logic from middleware
    const baseUrl = "";
    // Mocking badge counts for the example
    const badgeCounts = { payments: 1, clients: 2, schedule: 1 };

    const roleConfig = getRoleConfig(activeRole, baseUrl, badgeCounts);

    return (
        <UnifiedSidebar
            tenantName={tenantName}
            logoUrl={logoUrl}
            config={roleConfig}
        />
    );
}

// --- Unified Presentational Component ---

function UnifiedSidebar({ tenantName, logoUrl, config }: { tenantName: string, logoUrl: string, config: RoleConfig }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isDark = config.theme === "dark";

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/login");
                        router.refresh();
                    },
                },
            });
        } catch (error) {
            console.error("Session termination failed:", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className={cn(
            "flex flex-col h-full p-6 select-none",
            isDark ? "bg-zinc-950 text-white" : "bg-background text-foreground"
        )}>
            {/* Header */}
            <div className="flex flex-col mb-10 group">
                <div className="flex items-center gap-3">
                    {logoUrl ? (
                        <img src={logoUrl} alt={tenantName} className={cn("w-8 h-8 rounded-lg object-cover border", isDark ? "border-white/10" : "border-border")} />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm uppercase">
                            {tenantName?.[0] || "S"}
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <span className={cn("text-base font-black italic tracking-tight uppercase truncate", isDark && "text-zinc-100")}>
                            {tenantName}
                        </span>
                        <span className={cn("text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5", isDark ? "text-zinc-500" : "text-muted-foreground")}>
                            <span className="text-primary font-black lowercase">by</span> Strive.
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1.5">
                {config.navItems.map((item, idx) => {
                    const isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link key={idx} href={item.href} className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm group",
                            isActive
                                ? "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none pl-3.5"
                                : cn(isDark ? "text-zinc-400 hover:text-white hover:bg-white/5" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")
                        )}>
                            <div className="flex items-center gap-3.5">
                                <span className={cn("transition-colors", isActive ? "text-primary" : cn(isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-muted-foreground group-hover:text-foreground"))}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </div>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className={cn(
                                    "text-[10px] font-black font-mono w-4 h-4 rounded-full flex items-center justify-center border transition-colors",
                                    isActive
                                        ? "bg-primary text-black border-primary"
                                        : cn(isDark ? "bg-zinc-900 text-zinc-400 border-white/5 group-hover:text-white group-hover:border-white/10" : "bg-secondary text-muted-foreground border-border group-hover:border-accent-foreground")
                                )}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={cn("pt-6 border-t space-y-1.5", isDark ? "border-white/5" : "border-border")}>
                <div className={cn("px-4 py-2 mb-2 rounded-xl border flex items-center gap-2", isDark ? "bg-zinc-900/30 border-white/5 text-zinc-400" : "bg-secondary text-muted-foreground border-border")}>
                    {config.badgeIcon}
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                        {config.badgeText}
                    </span>
                </div>

                <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} className="group-hover:-translate-x-1 transition-transform duration-200" />}
                    <span className="text-sm font-bold">{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
            </div>
        </div>
    );
}