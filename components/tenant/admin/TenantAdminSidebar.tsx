// components/platform/dashboard/TenantAdminSidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Loader2,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantAdminSidebarProps {
    tenantName?: string;
    logoUrl?: string;
}

export function TenantAdminSidebar({ tenantName, logoUrl }: TenantAdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    // Dynamic routing fallback context from the URL [subdomain] path parameter
    const subdomain = (params?.subdomain as string) || "console";

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
            console.error("Operator session termination failed:", error);
            setIsLoggingOut(false);
        }
    };

    // Construct tenant scoped administrative safe paths
    const baseAdminUrl = ``;

    return (
        <div className="flex flex-col h-full p-6 bg-zinc-950 text-white select-none">

            {/* Multi-Tenant Header Box */}
            <div className="flex flex-col mb-10 group">
                <div className="flex items-center gap-3">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={tenantName || "Gym Logo"}
                            className="w-8 h-8 rounded-lg object-cover border border-white/10"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm uppercase">
                            {tenantName?.[0] || "G"}
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <span className="text-base font-black italic tracking-tight uppercase truncate text-zinc-100">
                            {tenantName || "Partner Gym"}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">
                            <span className="text-primary font-black lowercase">by</span> Strive.
                        </span>
                    </div>
                </div>
            </div>

            {/* B2B Operational Navigation Layer */}
            <nav className="flex-1 space-y-1.5">
                <SidebarItem
                    icon={<LayoutDashboard size={18} />}
                    label="Console"
                    href={`${baseAdminUrl}/console`}
                    active={pathname === `${baseAdminUrl}/console`}
                />
                <SidebarItem
                    icon={<Users size={18} />}
                    label="Members"
                    href={`${baseAdminUrl}/members`}
                    active={pathname.startsWith(`${baseAdminUrl}/members`)}
                />
                <SidebarItem
                    icon={<Users size={18} />}
                    label="Invites"
                    href={`${baseAdminUrl}/invites`}
                    active={pathname.startsWith(`${baseAdminUrl}/invites`)}
                />
                <SidebarItem
                    icon={<BarChart3 size={18} />}
                    label="Reports"
                    href={`${baseAdminUrl}/reports`}
                    active={pathname.startsWith(`${baseAdminUrl}/reports`)}
                />
                <SidebarItem
                    icon={<Settings size={18} />}
                    label="Settings"
                    href={`${baseAdminUrl}/settings`}
                    active={pathname.startsWith(`${baseAdminUrl}/settings`)}
                />
            </nav>

            {/* Footer Control Area */}
            <div className="pt-6 border-t border-white/5 space-y-1.5">
                <div className="px-4 py-2 mb-2 rounded-xl bg-zinc-900/30 border border-white/5 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                        Administrator Access
                    </span>
                </div>

                <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {isLoggingOut ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform duration-200" />
                    )}
                    <span className="text-sm font-bold">
                        {isLoggingOut ? "Signing out..." : "Sign Out"}
                    </span>
                </button>
            </div>
        </div>
    );
}

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
}

function SidebarItem({ icon, label, href, active = false }: SidebarItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                active
                    ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(249,115,22,0.03)] border-l-2 border-primary rounded-l-none pl-3.5"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
        >
            <span className={cn("transition-colors", active ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300")}>
                {icon}
            </span>
            <span>{label}</span>
        </Link>
    );
}