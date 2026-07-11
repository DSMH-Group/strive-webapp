// app/tenants/[subdomain]/member/progress/progressClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Trophy, Info, Flame, Compass, Smartphone, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MuscleMap } from "@/components/tenant/shared/MuscleMap";
import { WearableSyncWizard } from "@/components/tenant/member/WearableSyncWizard";
import { WearableProgressBoards } from "@/components/tenant/member/WearableProgressBoards";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ProgressClientProps {
    subdomain: string;
    tenantId: string;
    progressData: any;
}

const chartConfig = {
    performance: {
        label: "Mass",
        color: "hsl(var(--primary))",
    }
} satisfies ChartConfig;

export default function ProgressClient({ subdomain, tenantId, progressData }: ProgressClientProps) {
    const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isGoogleLinked, setIsGoogleLinked] = useState(false);

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
        <div className="space-y-6 text-foreground select-none animate-in fade-in duration-500 max-w-7xl mx-auto">

            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight">My Progress</h1>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Weight Timeline */}
                <Card className="lg:col-span-7 bg-card border-border rounded-2xl p-6 shadow-sm">
                    <div className="space-y-1 mb-6">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Body Weight</span>
                        <h3 className="text-sm font-bold text-foreground">{activeProgress.chartLabel}</h3>
                    </div>

                    <div className="h-48 w-full font-mono text-[10px]">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activeProgress.timeSeries} margin={{ left: -24, right: 6, top: 6 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="marker" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
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
                <Card className="lg:col-span-5 bg-card border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="space-y-1 mb-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Personal Records</span>
                    </div>

                    <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                        {activeProgress.personalRecords.map((pr: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl hover:border-primary/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm font-bold text-foreground">{pr.label}</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                    <span className="text-sm font-black text-foreground">{pr.value}</span>
                                    <span className="text-[10px] font-bold text-emerald-500 font-sans bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        {pr.change}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Muscle Activity Section Grid Layout */}
            <Card className="bg-card border-border rounded-2xl p-6 shadow-sm">
                <div className="text-center space-y-1 mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Muscle Activity</span>
                    <p className="text-xs text-muted-foreground">Based on recent active performance data</p>
                </div>

                {/* Dual Mapping Layout View */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground font-mono uppercase">Anterior</span>
                        <MuscleMap
                            view="anterior"
                            activatedZones={activeProgress.activatedZones}
                            onHover={setHoveredMuscle}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground font-mono uppercase">Posterior</span>
                        <MuscleMap
                            view="posterior"
                            activatedZones={activeProgress.activatedZones}
                            onHover={setHoveredMuscle}
                        />
                    </div>
                </div>

                {/* Interactive HUD Readout */}
                <div className="h-6 flex items-center justify-center font-mono text-xs mt-6">
                    {hoveredMuscle ? (
                        <span className="text-primary font-bold bg-primary/10 px-4 py-1 rounded-full border border-primary/20 animate-fade-in">
                            Target Group: {hoveredMuscle} Volume Monitored
                        </span>
                    ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" /> Tap targeted anatomical zones to break down load parameters
                        </span>
                    )}
                </div>
            </Card>

            {/* 28-Day Attendance Block */}
            <Card className="bg-card border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">28-Day Attendance</span>
                    <div className="flex items-center gap-1.5 text-xs text-orange-500 font-bold">
                        <Flame className="w-4 h-4 fill-current" /> {activeProgress.streak}-day streak
                    </div>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 max-w-2xl font-mono text-[9px] text-muted-foreground">
                    {Array.from({ length: 28 }).map((_, i) => {
                        const activeMap = [2, 3, 6, 7, 11, 12, 16, 17, 21, 22, 23, 24, 25, 26];
                        const checkedIn = activeMap.includes(i);
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "aspect-square rounded-md border transition-all",
                                    checkedIn
                                        ? "bg-primary/80 border-primary/40 shadow-sm"
                                        : "bg-muted border-border"
                                )}
                            />
                        );
                    })}
                </div>
            </Card>

            {/* 🚀 Wearables Integration Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Fit / Wear OS Integration Card */}
                <Card className="bg-card border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Android & Google wearables</span>
                            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                                🤖 Wear OS / Health Connect
                            </h3>
                            <p className="text-xs text-muted-foreground leading-normal pr-4">
                                Link pixel watch, galaxy watch, or health connect streams to auto-sync biometrics.
                            </p>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isGoogleLinked 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                            {isGoogleLinked ? "Linked & Syncing" : "Not Connected"}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            onClick={() => setIsWizardOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-10 px-4 rounded-xl flex items-center gap-1.5"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Sync Wear OS
                        </Button>
                    </div>
                </Card>

                {/* Apple Health Integration Card */}
                <Card className="bg-card border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 opacity-75">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">iOS & Apple wearables</span>
                            <h3 className="text-sm font-extrabold text-muted-foreground flex items-center gap-1.5">
                                🍎 Apple HealthKit
                            </h3>
                            <p className="text-xs text-muted-foreground leading-normal pr-4">
                                Sync apple watch activity pools, resting HR levels, and exercise rings.
                            </p>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Coming Soon
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            disabled 
                            variant="outline"
                            className="border-border text-muted-foreground text-xs font-bold h-10 px-4 rounded-xl cursor-not-allowed flex items-center gap-1.5"
                        >
                            <Smartphone className="w-3.5 h-3.5" /> iOS Companion Required
                        </Button>
                    </div>
                </Card>
            </div>

            {/* 🚀 Wearables Recharts Board */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono block">Health Dashboard</span>
                    <h2 className="text-lg font-black text-foreground">Wearable Metrics</h2>
                </div>
                <WearableProgressBoards tenantId={tenantId} />
            </div>

            <WearableSyncWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                tenantId={tenantId}
                onSyncComplete={() => {
                    setIsGoogleLinked(true);
                    toast.success("Successfully synced health metrics from Google Wear OS device!");
                }}
            />
        </div>
    );
}