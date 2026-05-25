// app/(platform)/(dashboard)/dashboard/components/athlete-metrics.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Flame, Loader2, TrendingUp, Trophy } from "lucide-react";
import { striveClientFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AthleteMetricsProps {
    tenantId: string;
}

// These align with the interfaces we defined earlier
interface MembershipResponse {
    status: 'PENDING' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'CANCELLED' | 'REVOKED';
    planName?: string;
    expiryDate?: string;
    tenantName?: string;
}

interface AttendanceResponse {
    monthlyCount: number;
    weeklyStreak: number;
    weeklyDistribution: Record<string, number>;
}

interface MetricResponse {
    id: string;
    metricType: string;
    data: { value: number; unit: string };
}

export function AthleteMetrics({ tenantId }: AthleteMetricsProps) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["athleteMetrics", tenantId],
        queryFn: async () => {
            // Fire all three scoped requests concurrently
            const [membershipRes, attendanceRes, metricsRes] = await Promise.all([
                striveClientFetch("/api/v1/members/me", { method: "GET", tenantId }),
                striveClientFetch("/api/v1/attendances", { method: "GET", tenantId }),
                striveClientFetch("/api/v1/metrics?metricType=PR", { method: "GET", tenantId })
            ]);

            if (!membershipRes.ok) throw new Error("Failed to load athlete ledger.");

            return {
                membership: await membershipRes.json() as MembershipResponse,
                attendance: await attendanceRes.json() as AttendanceResponse,
                metrics: await metricsRes.json() as MetricResponse[]
            };
        },
        enabled: !!tenantId
    });

    if (isLoading) {
        return (
            <div className="w-full h-64 border border-border bg-card/50 rounded-lg flex flex-col items-center justify-center gap-3 animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Compiling Athlete Ledger...
                </span>
            </div>
        );
    }

    if (isError || !data?.membership) {
        return null; // Fallback handled gracefully by the parent component layout
    }

    const { membership, attendance, metrics } = data;

    // Derived Stats
    const prCount = metrics?.length || 0;
    const monthlySessions = attendance?.monthlyCount || 0;
    const weeklyAverage = (monthlySessions / 4.3).toFixed(1);
    const dayStreak = attendance?.weeklyStreak || 0;
    const weeklyVisits = attendance?.weeklyDistribution || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const daysMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            {/* 1. Athlete Passport Card */}
            <div className="relative overflow-hidden rounded-lg border border-border bg-card p-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                <div className="relative flex flex-col md:flex-row gap-6 p-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl italic">
                            {membership.tenantName?.substring(0, 2).toUpperCase() || "ST"}
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                Primary Facility
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-sm text-[8px]",
                                    membership.status === 'ACTIVE' ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive"
                                )}>
                                    {membership.status}
                                </span>
                            </span>
                            <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                                <div>PLAN <span className="text-foreground font-bold ml-1">{membership.planName || "Standard"}</span></div>
                                <div>EXPIRES <span className="text-foreground font-bold ml-1">
                                    {membership.expiryDate ? new Date(membership.expiryDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    }) : "N/A"}
                                </span></div>
                            </div>
                        </div>
                    </div>

                    {membership.status === "ACTIVE" ? (
                        <Button variant="outline" className="w-full md:w-auto rounded-md border-border bg-background hover:bg-primary hover:text-primary-foreground transition-all text-xs uppercase font-bold tracking-tight h-10 px-5">
                            Self Check-In <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    ) : (
                        <Button disabled variant="destructive" className="w-full md:w-auto rounded-md opacity-80 text-xs uppercase font-bold tracking-tight h-10 px-5">
                            Payment Required
                        </Button>
                    )}
                </div>
            </div>

            {/* 2. Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border rounded-lg p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em]">
                        <Calendar size={14} /> Sessions this month
                    </div>
                    <div className="text-2xl font-black text-foreground">{monthlySessions}</div>
                </Card>
                <Card className="bg-card border-border rounded-lg p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em]">
                        <Trophy size={14} /> PRs logged
                    </div>
                    <div className="text-2xl font-black text-primary">{prCount}</div>
                </Card>
                <Card className="bg-card border-border rounded-lg p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em]">
                        <TrendingUp size={14} /> Avg / Week
                    </div>
                    <div className="text-2xl font-black text-emerald-500">{weeklyAverage}</div>
                </Card>
            </div>

            {/* 3. Live Heatmap / Attendance Chart */}
            <Card className="bg-card border-border rounded-lg overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="flex justify-between items-end border-b border-border/50 pb-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Weekly Velocity</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Attendance Distribution</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 text-primary font-black italic text-lg">
                                <Flame size={18} className="fill-current" /> {dayStreak}
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Day Streak</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between h-32 pt-2">
                        {Object.entries(weeklyVisits).map(([day, percentage]) => {
                            const isToday = new Date().getDay() === (daysMap[day as keyof typeof daysMap] ?? -1);
                            const hasAttended = percentage > 0;

                            return (
                                <div key={day} className="flex flex-col items-center gap-3 w-full group">
                                    <div
                                        style={{ height: `${Math.max(percentage, 5)}%` }}
                                        className={cn(
                                            "w-8 md:w-12 rounded-sm transition-all duration-700 relative",
                                            hasAttended ? 'bg-primary' : 'bg-muted border border-border',
                                            isToday && !hasAttended && 'bg-primary/20 border-primary/30 border border-dashed'
                                        )}
                                    >
                                        {/* Hover Tooltip equivalent */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[9px] font-bold px-2 py-1 rounded pointer-events-none">
                                            {percentage}%
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-tighter",
                                        isToday ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}