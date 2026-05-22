import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Building2, Search, Sparkles} from "lucide-react";
import Link from "next/link";

export function NoContextDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 relative">

            {/* 1. B2B Conversion Banner at the very top */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 p-[1px]">
                <div
                    className="bg-zinc-950 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div
                            className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-widest">
                            <Sparkles size={14} className="fill-current"/> Strive for Business
                        </div>
                        <h2 className="text-lg font-black italic uppercase tracking-tight text-white">
                            Own a fitness facility in Sri Lanka?
                        </h2>
                        <p className="text-xs text-zinc-400 max-w-xl">
                            Deploy cutting-edge check-ins, automated SSCL/VAT tax billing, and instant SMS attendance
                            alerts for your club.
                        </p>
                    </div>
                    <Link href="/onboarding/provision-tenant" passHref >
                        <Button
                            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 shrink-0">
                            Launch Your Gym <Building2 className="ml-2 w-4 h-4"/>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 2. Focused Action Overlay Layer */}
            <div className="absolute inset-x-0 top-32 bottom-0 z-50 flex items-center justify-center p-4">
                <Card
                    className="w-full max-w-md bg-zinc-900/80 border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-black/80 border text-center p-8 space-y-6 animate-in zoom-in-95 duration-300">
                    <div
                        className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Search size={28}/>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                            Connect Your Space
                        </h2>
                        <p className="text-sm text-zinc-400">
                            You haven&apos;t joined a Strive-powered gym or country club yet. Find your home facility to
                            instantly monitor your passes, streaks, and PRs.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link href="/discover" passHref >
                            <Button
                                className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-950 font-black uppercase tracking-wider rounded-xl transition-all">
                                Explore Partner Gyms
                            </Button>
                        </Link>
                        <Link href="/support/find-subdomain" passHref >
                            <Button variant="ghost"
                                    className="w-full h-12 text-zinc-400 hover:text-white font-medium text-xs">
                                My gym uses Strive - Find my club URL
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>

            {/* 3. Blurs & Structural Mock Layout (Provides visual context behind the glass filter) */}
            <div
                className="pointer-events-none select-none filter blur-md opacity-25 space-y-8 transition-all duration-1000">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">MONDAY, MAY 18</p>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-700">Good morning,
                        Athlete</h1>
                </div>

                <div
                    className="rounded-[2rem] border border-white/5 bg-zinc-900/50 p-12 flex justify-between items-center"/>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12"/>
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12"/>
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-12"/>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] h-48"/>
            </div>
        </div>
    );
}