"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";

export function UserAccountNav({ user }: { user: any }) {
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login");
                    router.refresh(); // Clear the server cache
                },
            },
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
                {/* 🚀 FIXED: Replaced bg-zinc-900 and border-white/10 with semantic tokens */}
                <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
                    {user?.image ? (
                        <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
            </DropdownMenuTrigger>

            {/* 🚀 FIXED: Replaced bg-zinc-950 and text-white with bg-popover and text-popover-foreground */}
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border text-popover-foreground p-2 rounded-xl shadow-lg">
                <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-bold leading-none">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>

                {/* 🚀 FIXED: Replaced bg-white/5 with bg-border */}
                <DropdownMenuSeparator className="bg-border" />

                {/* 🚀 FIXED: Hover states now use standard accent tokens */}
                <DropdownMenuItem 
                    onClick={() => router.push("/settings")}
                    className="focus:bg-accent focus:text-accent-foreground cursor-pointer gap-2 py-2.5 rounded-md transition-colors"
                >
                    <Settings className="w-4 h-4" /> Account Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border" />

                {/* 🚀 FIXED: Leveraged the destructive token for the sign out button */}
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2 py-2.5 rounded-md transition-colors"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}