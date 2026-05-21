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
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center hover:border-primary/50 transition-colors">
                    {user.image ? (
                        <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-white/10 text-white p-2">
                <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-bold leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem className="focus:bg-white/5 cursor-pointer gap-2 py-2.5">
                    <Settings className="w-4 h-4" /> Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-500 focus:bg-red-500/10 cursor-pointer gap-2 py-2.5"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}