// components/tenant/member/TenantMemberSidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
    Home,
    Dumbbell,
    TrendingUp,
    CreditCard,
    LogOut,
    Loader2,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantMemberSidebarProps {
    tenantName?: string;
    logoUrl?: string;
    badgeCounts?: {
        payments?: number;
    };
}

export function TenantMemberSidebar({
                                        tenantName,
                                        logoUrl,
                                        badgeCounts = { payments: 1 }
                                    }: TenantMemberSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const subdomain = (params?.subdomain as string) || "app";
    // Bound the URL structure cleanly to the multi-tenant edge pattern pathing
    const baseMemberUrl = ``;

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
            console.error("Member session termination failure:", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-6 bg-background text-foreground select-none">

            {/* Gym Identification Header Block */}
            <div className="flex flex-col mb-10">
                <div className="flex items-center gap-3">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={tenantName || "Gym Logo"}
                            className="w-8 h-8 rounded-lg object-cover border border-border"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm uppercase">
                            {tenantName?.[0] || "F"}
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <span className="text-base font-black italic tracking-tight uppercase truncate">
                            {tenantName || "FitForge"}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                            Member <span className="text-primary font-black lowercase">by</span> Strive.
                        </span>
                    </div>
                </div>
            </div>

            {/* B2C Functional Navigation Items */}
            <nav className="flex-1 space-y-1.5">
                <SidebarItem
                    icon={<Home size={18} />}
                    label="Overview"
                    href={`${baseMemberUrl}/overview`}
                    active={pathname === `${baseMemberUrl}/overview` || pathname === baseMemberUrl}
                />
                <SidebarItem
                    icon={<Dumbbell size={18} />}
                    label="Activities"
                    href={`${baseMemberUrl}/activities`}
                    active={pathname.startsWith(`${baseMemberUrl}/activities`)}
                />
                <SidebarItem
                    icon={<TrendingUp size={18} />}
                    label="Progress"
                    href={`${baseMemberUrl}/progress`}
                    active={pathname.startsWith(`${baseMemberUrl}/progress`)}
                />
                <SidebarItem
                    icon={<CreditCard size={18} />}
                    label="Payments"
                    href={`${baseMemberUrl}/payments`}
                    active={pathname.startsWith(`${baseMemberUrl}/payments`)}
                    badge={badgeCounts.payments}
                />
            </nav>

            {/* Footer Workspace Configuration Profile Actions */}
            <div className="pt-6 border-t border-border space-y-1.5">
                <Link href={`${baseMemberUrl}/profile`}>
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all font-bold text-sm cursor-pointer",
                        pathname.startsWith(`${baseMemberUrl}/profile`) && "bg-secondary text-secondary-foreground border border-border"
                    )}>
                        <User size={16} />
                        <span>Member Access</span>
                    </div>
                </Link>

                <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
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
                "flex items-center justify-between px-4 py-3 rounded-lg transition-all font-bold text-sm group",
                active
                    ? "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none pl-3.5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
        >
            <div className="flex items-center gap-3.5">
                <span className={cn("transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                    {icon}
                </span>
                <span>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className={cn(
                    "text-[10px] font-black font-mono w-4 h-4 rounded-full flex items-center justify-center transition-all border",
                    active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border group-hover:border-accent-foreground"
                )}>
                    {badge}
                </span>
            )}
        </Link>
    );
}