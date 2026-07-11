"use client";

import React, {useState} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useQuery} from "@tanstack/react-query";
import {authClient} from "@/lib/auth-client";
import {striveClientFetch} from "@/lib/api";
import {cn} from "@/lib/utils";
import {
    BarChart3,
    Calendar,
    ClipboardSignature,
    CreditCard,
    Dumbbell,
    Home,
    LayoutDashboard,
    Loader2,
    LogOut,
    Settings,
    ShieldCheck,
    TrendingUp,
    Users
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

interface NavGroup {
    title: string;
    items: NavItem[];
}

interface SidebarConfig {
    rolesDisplay: string[];
    groups: NavGroup[];
}

// --- Configuration Generator ---
const generateSidebarConfig = (roles: string[], baseUrl: string, badgeCounts: any = {}): SidebarConfig => {
    const groups: NavGroup[] = [];
    const rolesDisplay: string[] = [];

    // 1. Administration Group
    if (roles.includes("ORG_ADMIN")) {
        rolesDisplay.push("Admin");
        groups.push({
            title: "Administration",
            items: [
                {icon: <LayoutDashboard size={16}/>, label: "Console", href: `${baseUrl}/console`, matchExact: true},
                {icon: <Users size={16}/>, label: "Members", href: `${baseUrl}/members`},
                {icon: <Users size={16}/>, label: "Invites", href: `${baseUrl}/invites`},
                {icon: <BarChart3 size={16}/>, label: "Reports", href: `${baseUrl}/reports`},
                {icon: <Settings size={16}/>, label: "Settings", href: `${baseUrl}/settings`},
            ]
        });
    }

    // 2. Staff Group
    if (roles.some(r => ["STAFF", "MANAGER", "TRAINER"].includes(r))) {
        rolesDisplay.push("Staff");
        groups.push({
            title: "Workspace & Staff",
            items: [
                {
                    icon: <Users size={16}/>,
                    label: "Clients",
                    href: `${baseUrl}/clients`,
                    matchExact: true,
                    badge: badgeCounts?.clients
                },
                {
                    icon: <Calendar size={16}/>,
                    label: "Schedule",
                    href: `${baseUrl}/schedule`,
                    badge: badgeCounts?.schedule
                },
                {icon: <ClipboardSignature size={16}/>, label: "Log Session", href: `${baseUrl}/log`},
            ]
        });
    }

    // 3. Member / Personal Group
    // We show this if they are explicitly a member, or as a default fallback if no roles are found
    if (roles.includes("MEMBER") || roles.length === 0) {
        if (roles.includes("MEMBER")) rolesDisplay.push("Member");
        groups.push({
            title: "Personal",
            items: [
                {icon: <Home size={16}/>, label: "Overview", href: `${baseUrl}/overview`, matchExact: true},
                {icon: <Dumbbell size={16}/>, label: "Activities", href: `${baseUrl}/activities`},
                {icon: <TrendingUp size={16}/>, label: "Progress", href: `${baseUrl}/progress`},
                {
                    icon: <CreditCard size={16}/>,
                    label: "Payments",
                    href: `${baseUrl}/payments`,
                    badge: badgeCounts?.payments
                },
            ]
        });
    }

    // Fallback display text if somehow empty
    if (rolesDisplay.length === 0) rolesDisplay.push("Member");

    return {groups, rolesDisplay};
};

// --- Main Manager Component ---

export function TenantSidebarManager({tenantId, config}: SidebarManagerProps) {
    const {data: userProfile, isLoading, error} = useQuery({
        queryKey: ["sidebarProfileHandshake", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/users/me", {method: "GET"});
            if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
            return await res.json();
        }
    });

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-6 bg-background border-r border-border">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/60"/>
            </div>
        );
    }

    if (error) console.error("[SidebarManager] Sync Error:", error);

    const activeMembership = userProfile?.memberships?.find((m: any) =>
        m.tenantId === tenantId || m.tenant?.id === tenantId
    );

    // Extract all roles this user holds for the current tenant
    const roles: string[] = activeMembership?.roles?.map((r: any) => r.role) || [];

    const tenantName = config?.name || "Workspace";
    const logoUrl = config?.themeConfig?.logoUrl;

    // In a real scenario, base URLs would adapt to the subdomain logic from middleware
    const baseUrl = "";
    // Mocking badge counts for the example
    const badgeCounts = {payments: 1, clients: 2, schedule: 1};

    const sidebarConfig = generateSidebarConfig(roles, baseUrl, badgeCounts);

    return (
        <UnifiedSidebar
            tenantName={tenantName}
            logoUrl={logoUrl}
            config={sidebarConfig}
        />
    );
}

// --- Unified Presentational Component ---
function UnifiedSidebar({tenantName, logoUrl, config}: { tenantName: string, logoUrl: string, config: SidebarConfig }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        <div className="flex flex-col h-full bg-background border-r border-border text-foreground select-none w-64">
            {/* Header: Focused on Gym Identity */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={tenantName}
                            className="w-10 h-10 rounded-lg object-cover border border-border shadow-sm"
                        />
                    ) : (
                        <div
                            className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg uppercase shadow-sm">
                            {tenantName?.[0] || "S"}
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate tracking-tight">
                            {tenantName}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 custom-scrollbar">
                {config.groups.map((group, groupIdx) => (
                    <div key={groupIdx} className="flex flex-col space-y-1">
                        <h3 className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            {group.title}
                        </h3>
                        <nav className="space-y-0.5">
                            {group.items.map((item, idx) => {
                                const isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={idx}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between px-2 py-2 rounded-md transition-all text-[13px] font-medium group",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "transition-colors",
                                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                            )}>
                                                {item.icon}
                                            </span>
                                            <span>{item.label}</span>
                                        </div>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className={cn(
                                                "text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-secondary text-muted-foreground group-hover:bg-muted-foreground/20"
                                            )}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </div>

            {/* Footer: Strive Branding + Access + Sign Out */}
            <div className="p-4 border-t border-border mt-auto bg-background/50 space-y-3">
                {/* Powered By Strive */}
                <div className="px-2 flex items-center gap-1.5 opacity-60">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        Powered by <span className="text-primary font-bold">Strive</span>
                    </span>
                </div>

                <div
                    className="px-2 py-2 rounded-md bg-secondary/50 border border-border/50 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary shrink-0"/>
                    <span className="text-[11px] font-medium text-muted-foreground truncate">
                        Access: {config.rolesDisplay.join(", ")}
                    </span>
                </div>

                <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-md text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {isLoggingOut ? (
                        <Loader2 size={16} className="animate-spin"/>
                    ) : (
                        <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200"/>
                    )}
                    <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
            </div>
        </div>
    );
}