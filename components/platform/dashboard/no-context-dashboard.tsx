// app/(platform)/(dashboard)/dashboard/components/no-context-dashboard.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
    initialUser: { name: string };
    hideOnboardingBanner?: boolean;
    isSubSection?: boolean; // Changes the UI if it's just replacing the Athlete stats
}

export function NoContextDashboard({ initialUser, hideOnboardingBanner = false, isSubSection = false }: Props) {
    return (
        <div className="relative animate-in fade-in duration-700 w-full">

            {/* The structural blur layer showing "potential" */}
            <div className="pointer-events-none select-none opacity-30 filter blur-sm space-y-6">
                {!isSubSection && (
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-muted-foreground">
                        Good morning, {initialUser.name.split(' ')[0]}
                    </h1>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-md h-24" />
                    <div className="bg-card border border-border rounded-md h-24" />
                    <div className="bg-card border border-border rounded-md h-24" />
                </div>
                <div className="bg-card border border-border rounded-md h-64" />
            </div>

            {/* The Action Overlay */}
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-6 w-full max-w-lg">

                    <Card className="w-full bg-card/95 border-border backdrop-blur-xl shadow-2xl p-8 text-center space-y-6 rounded-xl">
                        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Search size={24} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
                                {isSubSection ? "No Active Athlete Data" : "Connect Your Passport"}
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {isSubSection
                                    ? "You are managing workspaces, but you haven't linked an active athlete membership to track your own PRs and attendance streaks."
                                    : "You haven't joined a Strive-powered facility yet. Find your home club to monitor your passes, streaks, and fitness milestones."}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button className="w-full h-11 bg-foreground text-background font-bold uppercase tracking-wider text-[10px]">
                                <Link href="/discover">Explore Partner Gyms</Link>
                            </Button>
                        </div>
                    </Card>

                    {/* B2B Banner only shows for completely new users */}
                    {!hideOnboardingBanner && (
                        <Card className="w-full bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-5 flex flex-col sm:flex-row items-center gap-4 justify-between rounded-xl">
                            <div className="space-y-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-primary font-bold text-[9px] uppercase tracking-widest">
                                    <Sparkles size={12} className="fill-current"/> Strive for Business
                                </div>
                                <h3 className="text-sm font-bold uppercase text-foreground">Own a fitness facility?</h3>
                            </div>
                            <Button variant="outline" className="h-9 text-[10px] uppercase font-bold tracking-widest shrink-0 border-primary/20 hover:bg-primary hover:text-primary-foreground">
                                <Link href="/onboarding/provision-tenant">Deploy Strive</Link>
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}