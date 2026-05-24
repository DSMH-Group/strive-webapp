// components/platform/dashboard/no-context-dashboard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NoContextDashboardProps {
    hideOnboardingBanner?: boolean;
}

export function NoContextDashboard({ hideOnboardingBanner = false }: NoContextDashboardProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 relative">

            {/* 1. Conditional B2B Conversion Banner */}
            {!hideOnboardingBanner && (
                <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-primary to-primary/6 p-[1px]">
                    <div className="bg-card rounded-md p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                <Sparkles size={14} className="fill-current"/> Strive for Business
                            </div>
                            <h2 className="text-lg font-black italic uppercase tracking-tight text-foreground">
                                Own a fitness facility in Sri Lanka?
                            </h2>
                            <p className="text-xs text-muted-foreground max-w-xl">
                                Deploy cutting-edge check-ins, automated SSCL/VAT tax billing, and instant SMS attendance alerts for your club.
                            </p>
                        </div>
                        <Link href="/onboarding/provision-tenant" passHref>
                            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-md text-xs uppercase tracking-tight h-10 px-5 shrink-0">
                                Launch Your Gym <Building2 className="ml-2 w-4 h-4"/>
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* 2. Focused Action Overlay Layer */}
            <div className={cn(
                "absolute inset-x-0 z-30 flex items-center justify-center p-4",
                hideOnboardingBanner ? "top-12" : "top-32"
            )}>
                <Card className="w-full max-w-md bg-card/80 border-border backdrop-blur-md rounded-md shadow-xl border text-center p-8 space-y-6 models-in zoom-in-95 duration-300">
                    <div className="mx-auto w-16 h-16 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Search size={28}/>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
                            Connect Your Space
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            You haven&apos;t joined a Strive-powered gym or country club as an athlete yet. Find your home facility to instantly monitor your passes, streaks, and PRs.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link href="/discover" passHref>
                            <Button className="w-full h-11 bg-foreground hover:bg-foreground/90 text-background font-black uppercase tracking-wider rounded-md text-xs transition-all">
                                Explore Partner Gyms
                            </Button>
                        </Link>
                        <Link href="/support/pfind-subdomain" passHref>
                            <Button variant="ghost" className="w-full h-11 text-muted-foreground hover:text-foreground hover:bg-accent font-bold text-xs uppercase tracking-tight rounded-md">
                                My gym uses Strive - Find my club URL
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>

            {/* 3. Structural Mock Layout */}
            <div className={cn(
                "pointer-events-none select-none transition-all duration-1000 space-y-8 opacity-25",
                hideOnboardingBanner ? "filter-none" : "filter blur-md"
            )}>
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
                    </p>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-muted-foreground">Good morning, Athlete</h1>
                </div>

                <div className="rounded-md border border-border bg-card p-12 flex justify-between items-center"/>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-md p-12"/>
                    <div className="bg-card border border-border rounded-md p-12"/>
                    <div className="bg-card border border-border rounded-md p-12"/>
                </div>

                <div className="bg-card border border-border rounded-md h-48"/>
            </div>
        </div>
    );
}