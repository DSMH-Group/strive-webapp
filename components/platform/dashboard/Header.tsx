import {Bell, Menu, Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {UserAccountNav} from "@/components/platform/user-account-nav";
import {Sidebar} from "@/components/platform/dashboard/Sidebar";

export function DashboardHeader({user}: { user: any }) {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">

                {/* 1. Mobile Sidebar Trigger & Brand (Visible on mobile only) */}
                <div className="flex items-center gap-4 md:hidden">
                    <Sheet>
                        <SheetTrigger
                            className="group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 p-2 text-zinc-400 hover:bg-zinc-800">
                            <Menu size={20}/>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 bg-zinc-950 border-r-white/10 w-64">
                            <Sidebar/>
                        </SheetContent>
                    </Sheet>
                    <span className="text-xl font-black italic tracking-tighter text-primary">S.</span>
                </div>

                {/* 2. Global Search - The "Discovery" Engine */}
                <div className="hidden md:flex flex-1 max-w-md relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors"/>
                    <Input
                        placeholder="Search gyms, trainers, or activities..."
                        className="h-10 pl-10 bg-zinc-900/50 border-white/5 rounded-xl text-sm focus:ring-1 focus:ring-primary/20 placeholder:text-zinc-600 transition-all"
                    />
                </div>

                {/* 3. Actions Area */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Notifications with the "1" badge from your reference image */}
                    <Button variant="ghost" size="icon"
                            className="relative text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl">
                        <Bell size={20}/>
                        <span
                            className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-zinc-950"/>
                    </Button>

                    <div className="h-6 w-[1px] bg-white/10 mx-2 hidden md:block"/>

                    {/* Identity - Integrated with our UserAccountNav */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-xs font-bold leading-none">{user.name}</span>
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter mt-1">
                                Global Account
                            </span>
                        </div>
                        <UserAccountNav user={user}/>
                    </div>
                </div>
            </div>
        </header>
    );
}