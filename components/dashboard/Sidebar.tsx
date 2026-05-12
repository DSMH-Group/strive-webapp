"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
    Activity,
    LayoutDashboard,
    Search,
    Wallet,
    Settings,
    LogOut,
    Heart,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        // 1. Kick them to login
                        router.push("/login");
                        // 2. Refresh the router to clear any server-side session cache
                        router.refresh();
                    },
                },
            });
        } catch (error) {
            console.error("Sign out failed:", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-2 mb-12">
                <Activity className="w-8 h-8 text-primary" />
                <span className="text-2xl font-black italic tracking-tighter uppercase">Stride.</span>
            </div>

            <nav className="flex-1 space-y-2">
                <SidebarItem
                    icon={<LayoutDashboard size={18} />}
                    label="My Dashboard"
                    href="/dashboard"
                    active={pathname === "/dashboard"}
                />
                <SidebarItem
                    icon={<Search size={18} />}
                    label="Find Gyms"
                    href="/discover"
                    active={pathname === "/discover"}
                />
                <SidebarItem
                    icon={<Heart size={18} />}
                    label="Favorites"
                    href="/favorites"
                    active={pathname === "/favorites"}
                />
                <SidebarItem
                    icon={<Wallet size={18} />}
                    label="Payments"
                    href="/wallet"
                    badge="1"
                    active={pathname === "/wallet"}
                />
            </nav>

            <div className="pt-6 border-t border-white/5 space-y-2">
                <SidebarItem
                    icon={<Settings size={18} />}
                    label="Account Settings"
                    href="/settings"
                    active={pathname === "/settings"}
                />

                <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {isLoggingOut ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    )}
                    {isLoggingOut ? "Signing out..." : "Sign Out"}
                </button>
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, href, active = false, badge }: any) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                active
                    ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-bold">{label}</span>
            </div>
            {badge && (
                <span className="bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                    {badge}
                </span>
            )}
        </Link>
    );
}