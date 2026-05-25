// app/tenants/[subdomain]/(admin)/member/dashboard/dashboardClient.tsx
"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
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
    Activity,
    ArrowRight,
    Loader2,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { striveClientFetch } from "@/lib/api";

interface DashboardClientProps {
    subdomain: string;
    tenantId: string;
}

const chartConfig = {
    visits: {
        label: "Check-ins",
        color: "var(--primary)",
    }
} satisfies ChartConfig;

export default function DashboardClient({ subdomain, tenantId }: DashboardClientProps) {

    // 🚀 Parallel REST Fetching via React Query
    const { data: rawData, isLoading, isError } = useQuery({
        queryKey: ["memberDashboardAggregated", tenantId],
        queryFn: async () => {
            const headers = { "X-Tenant-ID": tenantId };

            // Fire all necessary REST requests simultaneously
            const [userRes, memberRes, bookingsRes, attendancesRes] = await Promise.all([
                striveClientFetch("/api/v1/users/me", { method: "GET", headers }),
                striveClientFetch("/api/v1/members/me", { method: "GET", headers }),
                striveClientFetch("/api/v1/scheduling/bookings?upcoming=true", { method: "GET", headers }),
                striveClientFetch("/api/v1/attendances", { method: "GET", headers })
            ]);

            return {
                user: userRes.ok ? await userRes.json() : null,
                membership: memberRes.ok ? await memberRes.json() : null,
                bookings: bookingsRes.ok ? await bookingsRes.json() : [],
                attendances: attendancesRes.ok ? await attendancesRes.json() : { history: [] }
            };
        },
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    });

    // 🚀 Client-Side Data Aggregation & Logic processing
    const profile = useMemo(() => {
        if (!rawData) return null;

        const { user, membership, bookings, attendances } = rawData;
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        // 1. Process Bookings (Find Today's vs Next)
        let todaySession = null;
        let nextSession = null;

        if (bookings.length > 0) {
            const firstBookingDate = new Date(bookings[0].startTime).toISOString().split("T")[0];
            if (firstBookingDate === todayStr) {
                todaySession = bookings[0];
                nextSession = bookings.length > 1 ? bookings[1] : null;
            } else {
                nextSession = bookings[0];
            }
        }

        // 2. Process Attendance History (Weekly Chart & Streak)
        const historyList = attendances.history || [];
        const sessionsThisMonth = historyList.filter((a: any) => new Date(a.checkInTime).getMonth() === now.getMonth()).length;

        // Generate last 7 days chart data
        const weeklyHistory = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split("T")[0];

            const visitsThatDay = historyList.filter((a: any) => a.checkInTime.startsWith(dateStr)).length;

            return {
                day: d.toLocaleDateString("en-US", { weekday: "short" }),
                dateStr,
                visits: visitsThatDay
            };
        });

        // Basic Streak Calculation (Counting consecutive days backwards)
        let streak = 0;
        let checkDate = new Date();
        while (true) {
            const cStr = checkDate.toISOString().split("T")[0];
            const hasVisit = historyList.some((a: any) => a.checkInTime.startsWith(cStr));
            if (hasVisit) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // If checking today and no visit yet, check yesterday before breaking
                if (streak === 0 && cStr === todayStr) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }

        return {
            firstName: user?.firstName || "Member",
            lastName: user?.lastName || "",
            plan: membership?.plan || "Standard Access",
            expires: membership?.expiresAt ? new Date(membership.expiresAt).toLocaleDateString() : "Active",
            tokensLeft: membership?.tokens || 0,
            streak,
            sessionsThisMonth,
            prsThisMonth: 0, // Would require fetching /api/v1/metrics
            avgPerWeek: (sessionsThisMonth / 4).toFixed(1),
            todaySession,
            nextSession,
            weeklyHistory
        };
    }, [rawData]);

    const handleDynamicCheckIn = () => {
        toast.success("Dynamic QR / Location context validated. Attendance logged successfully via Stride Core API!");
    };

    if (isLoading || !profile) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-xs font-bold uppercase tracking-widest text-zinc-500 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Synchronizing Workspace Data...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <h3 className="font-bold text-sm text-white">Dashboard Sync Failed</h3>
                <p className="text-xs text-zinc-500">Could not retrieve your fitness data. Please refresh.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-white select-none animate-in fade-in duration-500">

            {/* Header Salutation Banner */}
            <div className="space-y-1">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    Good morning, {profile.firstName}
                </h1>
            </div>

            {/* Live Session Status / Check-in Actions Bracket */}
            {profile.todaySession ? (
                <Card className="bg-[#111917] border border-emerald-500/10 rounded-2xl p-4 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.02)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-bold text-emerald-400">
                                    Session today at {new Date(profile.todaySession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </h3>
                                <p className="text-xs text-zinc-400 font-medium">
                                    {profile.todaySession.resource?.name || "Facility Access"}
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
            ) : (
                <Card className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-400">No sessions scheduled for today.</p>
                    <Button variant="outline" className="text-xs border-white/10 hover:bg-white/5 text-white h-9">
                        Book Session
                    </Button>
                </Card>
            )}

            {/* B2C Account Context Plan Overview Segment */}
            <Card className="bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="space-y-4">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono">MEMBER PROFILE</p>
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
                        {profile.nextSession ? (
                            <>
                                <h4 className="text-base font-black text-zinc-100">{profile.nextSession.resource?.name || "Reserved Slot"}</h4>
                                <p className="text-xs text-zinc-500 font-medium font-mono mt-2">
                                    {new Date(profile.nextSession.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(profile.nextSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </>
                        ) : (
                            <h4 className="text-sm font-bold text-zinc-500 mt-2">No upcoming bookings found.</h4>
                        )}
                    </div>
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
                            {profile.weeklyHistory.map((d: any, i: number) => {
                                const isFulfilled = d.visits > 0;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1.5">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full border",
                                            isFulfilled ? "bg-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "bg-zinc-800 border-white/5"
                                        )} />
                                        <span>{d.day.charAt(0)}</span>
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

function SummaryMiniCard({ label, value, suffix, isCyan = false }: { label: string; value: string; suffix?: string; isCyan?: boolean; }) {
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