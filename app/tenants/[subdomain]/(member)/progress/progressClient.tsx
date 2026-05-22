// app/tenants/[subdomain]/member/progress/progressClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Trophy, Info, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {MuscleMap} from "@/components/tenant/shared/MuscleMap";

interface ProgressClientProps {
    subdomain: string;
    progressData: any;
}

const chartConfig = {
    performance: {
        label: "Mass",
        color: "var(--primary)",
    }
} satisfies ChartConfig;

export default function ProgressClient({ subdomain, progressData }: ProgressClientProps) {
    const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

    const activeProgress = useMemo(() => {
        if (progressData) return progressData;
        return {
            vertical: "GYM",
            chartLabel: "Body Weight History",
            timeSeries: [
                { marker: "W1", performance: 92.5 },
                { marker: "W2", performance: 91.0 },
                { marker: "W3", performance: 89.8 },
                { marker: "W4", performance: 89.2 },
                { marker: "W5", performance: 88.5 },
                { marker: "W6", performance: 88.0 },
                { marker: "W7", performance: 87.3 },
                { marker: "W8", performance: 86.5 },
            ],
            personalRecords: [
                { label: "Bench", value: "90 kg", change: "+5 kg" },
                { label: "Squat", value: "110 kg", change: "+10 kg" },
                { label: "Deadlift", value: "130 kg", change: "+7.5 kg" },
                { label: "OHP", value: "60 kg", change: "+2.5 kg" },
            ],
            activatedZones: ["shoulders", "chest", "quads", "lats", "hamstrings"],
            streak: 12
        };
    }, [progressData]);

    return (
        <div className="space-y-6 text-white select-none animate-in fade-in duration-500">

            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight">My Progress</h1>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Weight Timeline */}
                <Card className="lg:col-span-7 bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                    <div className="space-y-1 mb-6">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Body Weight</span>
                        <h3 className="text-sm font-bold text-zinc-300">{activeProgress.chartLabel}</h3>
                    </div>

                    <div className="h-48 w-full font-mono text-[10px]">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activeProgress.timeSeries} margin={{ left: -24, right: 6, top: 6 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                                    <XAxis dataKey="marker" stroke="#52525b" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#52525b" tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <defs>
                                        <linearGradient id="progressAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-performance)" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="var(--color-performance)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="performance" stroke="var(--color-performance)" strokeWidth={2} fill="url(#progressAreaGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </Card>

                {/* Milestone Metrics Box */}
                <Card className="lg:col-span-5 bg-zinc-900/30 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                    <div className="space-y-1 mb-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Personal Records</span>
                    </div>

                    <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                        {activeProgress.personalRecords.map((pr: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-4 h-4 text-amber-500/60" />
                                    <span className="text-sm font-bold text-zinc-300">{pr.label}</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                    <span className="text-sm font-black text-white">{pr.value}</span>
                                    <span className="text-[10px] font-bold text-emerald-400 font-sans">
                                        {pr.change}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Muscle Activity Section Grid Layout */}
            <Card className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6">
                <div className="text-center space-y-1 mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">Muscle Activity</span>
                    <p className="text-xs text-zinc-400">Based on recent active performance data</p>
                </div>

                {/* Dual Mapping Layout View */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-black tracking-widest text-zinc-600 font-mono uppercase">Anterior</span>
                        <MuscleMap
                            view="anterior"
                            activatedZones={activeProgress.activatedZones} // e.g. ["chest", "quads", "abs"]
                            onHover={setHoveredMuscle}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-black tracking-widest text-zinc-600 font-mono uppercase">Posterior</span>
                        <MuscleMap
                            view="posterior"
                            activatedZones={activeProgress.activatedZones} // e.g. ["lats", "hamstrings"]
                            onHover={setHoveredMuscle}
                        />
                    </div>
                </div>

                {/* Interactive HUD Readout */}
                <div className="h-6 flex items-center justify-center font-mono text-xs text-zinc-500 mt-6">
                    {hoveredMuscle ? (
                        <span className="text-primary font-bold bg-primary/5 px-4 py-1 rounded-full border border-primary/10 animate-fade-in">
                Target Group: {hoveredMuscle} Volume Monitored
            </span>
                    ) : (
                        <span className="text-zinc-600 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Tap targeted anatomical zones to break down load parameters
            </span>
                    )}
                </div>
            </Card>

            {/* 28-Day Attendance Block (Mirroring Image 2) */}
            <Card className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">28-Day Attendance</span>
                    <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold">
                        <Flame className="w-4 h-4 fill-current" /> {activeProgress.streak}-day streak
                    </div>
                </div>

                <div className="grid grid-cols-14 gap-1.5 max-w-2xl font-mono text-[9px] text-zinc-600">
                    {Array.from({ length: 28 }).map((_, i) => {
                        // Mimic the cluster patterns from your layout snapshot file
                        const activeMap = [2, 3, 6, 7, 11, 12, 16, 17, 21, 22, 23, 24, 25, 26];
                        const checkedIn = activeMap.includes(i);
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "aspect-square rounded-md border transition-all",
                                    checkedIn
                                        ? "bg-amber-500/80 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                                        : "bg-zinc-900/40 border-white/5"
                                )}
                            />
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}