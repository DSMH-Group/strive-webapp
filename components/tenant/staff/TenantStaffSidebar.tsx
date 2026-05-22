// components/tenant/trainer/TenantStaffSidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
    Users,
    Calendar,
    ClipboardSignature,
    Settings,
    LogOut,
    Loader2,
    Dumbbell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantStaffSidebarProps {
    tenantName?: string;
    logoUrl?: string;
    badgeCounts?: {
        clients?: number;
        schedule?: number;
    };
}

export function TenantStaffSidebar({
                                         tenantName,
                                         logoUrl,
                                         badgeCounts = { clients: 2, schedule: 1 } // Falling back exactly to uploaded mockup values
                                     }: TenantStaffSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const subdomain = (params?.subdomain as string) || "console";
    const baseTrainerUrl = ``;

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
            console.error("Staff session termination failure:", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-6 bg-zinc-950 text-white select-none">

            {/* Gym Brand Header Context */}
            <div className="flex flex-col mb-10">
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
                            {tenantName || "FitForge"}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">
                            <span className="text-primary font-black lowercase">by</span> Strive.
                        </span>
                    </div>
                </div>
            </div>

            {/* Trainer Portal Specific Functional Navigation */}
            <nav className="flex-1 space-y-1.5">
                <SidebarItem
                    icon={<Users size={18} />}
                    label="Clients"
                    href={`${baseTrainerUrl}/clients`}
                    active={pathname === `${baseTrainerUrl}/clients` || pathname === baseTrainerUrl}
                    badge={badgeCounts.clients}
                />
                <SidebarItem
                    icon={<Calendar size={18} />}
                    label="Schedule"
                    href={`${baseTrainerUrl}/schedule`}
                    active={pathname.startsWith(`${baseTrainerUrl}/schedule`)}
                    badge={badgeCounts.schedule}
                />
                <SidebarItem
                    icon={<ClipboardSignature size={18} />}
                    label="Log"
                    href={`${baseTrainerUrl}/log`}
                    active={pathname.startsWith(`${baseTrainerUrl}/log`)}
                />
            </nav>

            {/* Footer Workspace Context Block */}
            <div className="pt-6 border-t border-white/5 space-y-1.5">
                <div className="px-4 py-2 mb-2 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center gap-2 text-zinc-400">
                    <Dumbbell size={14} className="text-primary" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                        Staff Access
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
    badge?: number;
}

function SidebarItem({ icon, label, href, active = false, badge }: SidebarItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm group",
                active
                    ? "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none pl-3.5"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-3.5">
                <span className={cn("transition-colors", active ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300")}>
                    {icon}
                </span>
                <span>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className={cn(
                    "text-[10px] font-black font-mono w-4 h-4 rounded-full flex items-center justify-center border transition-colors",
                    active
                        ? "bg-primary text-black border-primary"
                        : "bg-zinc-900 text-zinc-400 border-white/5 group-hover:text-white group-hover:border-white/10"
                )}>
                    {badge}
                </span>
            )}
        </Link>
    );
}