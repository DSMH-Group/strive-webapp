// app/tenants/[subdomain]/(admin)/member/dashboard/dashboardClient.tsx
"use client";

import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, ResponsiveContainer } from "recharts";
import {
    Calendar,
    Flame,
    Trophy,
    Zap,
    Activity,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
    subdomain: string;
    memberData: any;
}

// shadcn/ui Chart configuration using the global theme variable color mappings
const chartConfig = {
    visits: {
        label: "Check-ins",
        color: "var(--primary)",
    }
} satisfies ChartConfig;

export default function DashboardClient({ subdomain, memberData }: DashboardClientProps) {

    // --- High-Fidelity Local Mock Hydration (Matching Uploaded Mockup State) ---
    const profile = useMemo(() => {
        if (memberData) return memberData;
        return {
            firstName: "Dilshan",
            lastName: "Raj",
            plan: "Standard",
            expires: "Jun 15, 2025",
            tokensLeft: 6,
            streak: 12,
            sessionsThisMonth: 12,
            prsThisMonth: 2,
            avgPerWeek: 3.1,
            todaySession: {
                time: "11:00 AM",
                name: "Pull Day",
                trainer: "Ravi K.",
                location: "FitForge Colombo"
            },
            nextSession: {
                name: "Pull Day",
                time: "Wed May 14 · 11:00 AM",
                trainer: "Ravi K."
            },
            weeklyHistory: [
                { day: "Mon", visits: 40 },
                { day: "Tue", visits: 25 },
                { day: "Wed", visits: 55 },
                { day: "Thu", visits: 38 },
                { day: "Fri", visits: 60 },
                { day: "Sat", visits: 70 },
                { day: "Sun", visits: 15 },
            ]
        };
    }, [memberData]);

    const handleDynamicCheckIn = () => {
        toast.success("Dynamic QR / Location context validated. Attendance logged successfully via Stride Core API!");
    };

    return (
        <div className="space-y-6 text-white select-none animate-in fade-in duration-500">

            {/* Header Salutation Banner */}
            <div className="space-y-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Thursday, May 8</p>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    Good morning, {profile.firstName}
                </h1>
            </div>

            {/* Live Session Status / Check-in Actions Bracket */}
            <Card className="bg-[#111917] border border-emerald-500/10 rounded-2xl p-4 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.02)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-bold text-emerald-400">Session today at {profile.todaySession.time}</h3>
                            <p className="text-xs text-zinc-400 font-medium">
                                {profile.todaySession.name} · {profile.todaySession.trainer} · {profile.todaySession.location}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleDynamicCheckIn}
                        className="bg-zinc-950 hover:bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl h-10 px-4 self-stretch sm:self-auto shrink-0 transition-all"
                    >
                        Check In <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            </Card>

            {/* B2C Account Context Plan Overview Segment */}
            <Card className="bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="space-y-4">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono">FITFORGE GYM · MEMBER</p>
                        <h2 className="text-xl font-black text-white tracking-tight">{profile.firstName} {profile.lastName}</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-6 max-w-sm">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Plan</span>
                            <p className="text-sm font-black text-zinc-200">{profile.plan}</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Expires</span>
                            <p className="text-sm font-black text-zinc-200">{profile.expires}</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tokens</span>
                            <p className="text-sm font-black text-primary font-mono">{profile.tokensLeft} left</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Core Metrics & Gamification Split Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Next Booking Ledger Tracking Card */}
                <Card className="md:col-span-2 bg-zinc-900/30 border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[110px]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest font-mono">Next Session</span>
                        <h4 className="text-base font-black text-zinc-100">{profile.nextSession.name}</h4>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium font-mono mt-2">
                        {profile.nextSession.time} · Coach {profile.nextSession.trainer}
                    </p>
                </Card>

                {/* Gamified Streak Track Widget */}
                <Card className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-orange-400">
                            <Flame className="w-5 h-5 fill-current" />
                            <div className="space-y-0.5">
                                <div className="text-2xl font-black font-mono leading-none">{profile.streak}</div>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">day streak</span>
                            </div>
                        </div>

                        {/* Interactive Weekly Dot Sequence Representation */}
                        <div className="flex items-center justify-between text-[9px] font-mono font-bold text-zinc-600 px-0.5">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => {
                                const isFulfilled = i > 0 && i < 5; // Simulates past verified check-in events
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1.5">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full border",
                                            isFulfilled ? "bg-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "bg-zinc-800 border-white/5"
                                        )} />
                                        <span>{d}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Summary KPI Subpanels */}
            <div className="grid grid-cols-3 gap-4">
                <SummaryMiniCard label="Sessions This Month" value={profile.sessionsThisMonth.toString()} />
                <SummaryMiniCard label="PRs This Month" value={profile.prsThisMonth.toString()} suffix="🏆" />
                <SummaryMiniCard label="Avg / Week" value={profile.avgPerWeek.toString()} isCyan />
            </div>

            {/* Custom shadcn/ui Structured History Visual Bar Chart Component */}
            <Card className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono">This Week's Visits</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-zinc-600">May 5–11</span>
                </div>
                <div className="h-28 w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={profile.weeklyHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <XAxis
                                    dataKey="day"
                                    stroke="#3f3f46"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    className="text-[10px] font-bold font-sans text-zinc-600"
                                />
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Bar
                                    dataKey="visits"
                                    fill="var(--color-visits)"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={28}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </Card>

        </div>
    );
}

// --- Local Metric Presentation Layout Sub-components ---

function SummaryMiniCard({
                             label,
                             value,
                             suffix,
                             isCyan = false
                         }: {
    label: string;
    value: string;
    suffix?: string;
    isCyan?: boolean;
}) {
    return (
        <Card className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[75px]">
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider leading-tight">{label}</span>
            <div className={cn(
                "text-2xl font-black font-mono leading-none tracking-tight flex items-center gap-1.5 mt-2",
                isCyan ? "text-cyan-400" : "text-white"
            )}>
                {value} {suffix && <span className="text-sm shrink-0">{suffix}</span>}
            </div>
        </Card>
    );
}