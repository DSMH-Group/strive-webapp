import {Bell, Menu, Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {UserAccountNav} from "@/components/platform/user-account-nav";
import {Sidebar} from "@/components/platform/dashboard/Sidebar";

export function DashboardHeader({user}: { user: any }) {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">

                {/* 1. Mobile Sidebar Trigger & Brand (Visible on mobile only) */}
                <div className="flex items-center gap-4 md:hidden">
                    <Sheet>
                        <SheetTrigger
                            className="group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-card p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                            <Menu size={20}/>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 bg-background border-r-border w-64">
                            <Sidebar/>
                        </SheetContent>
                    </Sheet>
                    <span className="text-xl font-black italic tracking-tighter text-primary">S.</span>
                </div>

                {/* 2. Global Search - The "Discovery" Engine */}
                <div className="hidden md:flex flex-1 max-w-md relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"/>
                    <Input
                        placeholder="Search gyms, trainers, or activities..."
                        className="h-10 pl-10 bg-secondary/50 border-border rounded-xl text-sm focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground transition-all"
                    />
                </div>

                {/* 3. Actions Area */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Notifications with the "1" badge */}
                    <Button variant="ghost" size="icon"
                            className="relative text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors">
                        <Bell size={20}/>
                        {/* 🚀 FIXED: border-background ensures the cutout matches the dynamic theme background */}
                        <span
                            className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"/>
                    </Button>

                    {/* 🚀 FIXED: Replaced white/10 with semantic border color */}
                    <div className="h-6 w-[1px] bg-border mx-2 hidden md:block"/>

                    {/* Identity - Integrated with our UserAccountNav */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-xs font-bold leading-none text-foreground">{user?.name}</span>
                            <span
                                className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-1">
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