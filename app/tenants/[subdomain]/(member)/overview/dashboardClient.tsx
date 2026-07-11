// app/tenants/[subdomain]/(admin)/member/dashboard/dashboardClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { QrEntryModal } from "@/components/tenant/member/QrEntryModal";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
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
    ArrowRight,
    Loader2,
    AlertCircle,
    Clock,
    Activity
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
        color: "hsl(var(--primary))",
    }
} satisfies ChartConfig;

// Helper to calculate time spent in gym
const calculateDuration = (start: string, end: string | null) => {
    if (!end) return "Active Now";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
};

export default function DashboardClient({ subdomain, tenantId }: DashboardClientProps) {
    const [isQrOpen, setIsQrOpen] = useState(false);

    // 🚀 Dynamic Time-Based Greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    }, []);

    // 🚀 Parallel REST Fetching via React Query
    const { data: rawData, isLoading, isError } = useQuery({
        queryKey: ["memberDashboardAggregated", tenantId],
        queryFn: async () => {
            const headers = { "X-Tenant-ID": tenantId };

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
                attendances: attendancesRes.ok ? await attendancesRes.json() : []
            };
        },
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 2,
    });

    // 🚀 Client-Side Data Aggregation & Logic processing
    const profile = useMemo(() => {
        if (!rawData) return null;

        const { user, membership, bookings, attendances } = rawData;
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        // 1. Process Bookings
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

        // 2. Process Attendance History
        const historyList = Array.isArray(attendances) ? attendances : (attendances.history || []);

        // Sort history descending by Check-in Time
        const sortedHistory = [...historyList].sort((a: any, b: any) =>
            new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
        );

        const currentActiveVisit = sortedHistory.find((a: any) => a.checkOutTime === null);
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

        // Basic Streak Calculation
        let streak = 0;
        let checkDate = new Date();
        while (true) {
            const cStr = checkDate.toISOString().split("T")[0];
            const hasVisit = historyList.some((a: any) => a.checkInTime.startsWith(cStr));
            if (hasVisit) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
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
            plan: membership?.activePlan?.name || "Standard Access",
            expires: membership?.expiresAt ? new Date(membership.expiresAt).toLocaleDateString() : "Active",
            tokensLeft: membership?.tokensLeft || 0,
            streak,
            sessionsThisMonth,
            prsThisMonth: 0,
            avgPerWeek: (sessionsThisMonth / 4).toFixed(1),
            todaySession,
            nextSession,
            weeklyHistory,
            recentVisits: sortedHistory.slice(0, 5),
            currentActiveVisit,
            membership,
            user
        };
    }, [rawData]);

    if (isLoading || !profile) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-xs font-bold uppercase tracking-widest text-muted-foreground gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Synchronizing Workspace Data...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <h3 className="font-bold text-sm text-foreground">Dashboard Sync Failed</h3>
                <p className="text-xs text-muted-foreground">Could not retrieve your fitness data. Please refresh.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-foreground select-none animate-in fade-in duration-500">

            {/* Header Salutation Banner */}
            <div className="space-y-1">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    {greeting}, {profile.firstName}
                </h1>
            </div>

            {/* 🚀 LIVE STATUS / CHECK-IN BANNER */}
            {profile.currentActiveVisit ? (
                // User is currently in the gym
                <Card className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 animate-pulse" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-500">
                                <Activity className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-bold text-emerald-500">
                                    Currently in Facility
                                </h3>
                                <p className="text-xs text-emerald-500/80 font-medium">
                                    Checked in at {new Date(profile.currentActiveVisit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            ) : profile.todaySession ? (
                // User has a session booked today but is not in yet
                <Card className="bg-primary/5 border border-primary/20 rounded-2xl p-4 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-bold text-primary">
                                    Session today at {new Date(profile.todaySession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                    {profile.todaySession.resource?.name || "Facility Access"}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsQrOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl h-10 px-4 self-stretch sm:self-auto shrink-0 transition-all"
                        >
                            Generate Entry QR <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-muted-foreground">No sessions scheduled for today.</p>
                    <Button variant="outline" className="text-xs border-border hover:bg-accent text-foreground h-9">
                        Book Session
                    </Button>
                </Card>
            )}

            {/* B2C Account Context Plan Overview Segment */}
            <Card className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-primary/10 via-transparent to-transparent pointer-events-none" />
                <div className="space-y-4">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest font-mono">MEMBER PROFILE</p>
                        <h2 className="text-xl font-black text-foreground tracking-tight">{profile.firstName} {profile.lastName}</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-6 max-w-sm">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Plan</span>
                            <p className="text-sm font-black text-foreground">{profile.plan}</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expires</span>
                            <p className="text-sm font-black text-foreground">{profile.expires}</p>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tokens</span>
                            <p className="text-sm font-black text-primary font-mono">{profile.tokensLeft} left</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Core Metrics & Gamification Split Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2 bg-card border border-border rounded-2xl p-5 flex flex-col justify-between min-h-[110px]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest font-mono">Next Session</span>
                        {profile.nextSession ? (
                            <>
                                <h4 className="text-base font-black text-foreground">{profile.nextSession.resource?.name || "Reserved Slot"}</h4>
                                <p className="text-xs text-muted-foreground font-medium font-mono mt-2">
                                    {new Date(profile.nextSession.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(profile.nextSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </>
                        ) : (
                            <h4 className="text-sm font-bold text-muted-foreground mt-2">No upcoming bookings found.</h4>
                        )}
                    </div>
                </Card>

                <Card className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-orange-500">
                            <Flame className="w-5 h-5 fill-current" />
                            <div className="space-y-0.5">
                                <div className="text-2xl font-black font-mono leading-none">{profile.streak}</div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">day streak</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono font-bold text-muted-foreground px-0.5">
                            {profile.weeklyHistory.map((d: any, i: number) => {
                                const isFulfilled = d.visits > 0;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1.5">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full border",
                                            isFulfilled ? "bg-orange-500 border-orange-500 shadow-sm" : "bg-muted border-border"
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

            {/* 🚀 NEW: Recent Attendance Ledger */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest font-mono">This Week's Visits</span>
                    </div>
                    <div className="h-40 w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={profile.weeklyHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis
                                        dataKey="day"
                                        stroke="hsl(var(--muted-foreground))"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        className="text-[10px] font-bold font-sans"
                                    />
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Bar
                                        dataKey="visits"
                                        fill="hsl(var(--primary))"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={28}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </Card>

                <Card className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest font-mono">Recent Activity</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2">View All</Button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {profile.recentVisits.length > 0 ? (
                            <div className="space-y-3">
                                {profile.recentVisits.map((visit: any) => {
                                    const checkInDate = new Date(visit.checkInTime);
                                    const isActive = visit.checkOutTime === null;

                                    return (
                                        <div key={visit.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg border",
                                                    isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-muted border-border text-muted-foreground"
                                                )}>
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {checkInDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-muted-foreground">
                                                        {checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {visit.checkOutTime && ` → ${new Date(visit.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-xs font-black font-mono",
                                                    isActive ? "text-emerald-500 animate-pulse" : "text-muted-foreground"
                                                )}>
                                                    {calculateDuration(visit.checkInTime, visit.checkOutTime)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-8">
                                <Clock className="w-6 h-6 text-muted-foreground" />
                                <p className="text-xs font-medium text-muted-foreground">No recent visits recorded.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {profile?.membership && (
                <QrEntryModal
                    isOpen={isQrOpen}
                    onClose={() => setIsQrOpen(false)}
                    membershipId={profile.membership.id}
                    memberName={`${profile.user?.firstName || ''} ${profile.user?.lastName || ''}`}
                    membershipStatus={profile.membership.status}
                />
            )}
        </div>
    );
}

// --- Local Metric Presentation Layout Sub-components ---

function SummaryMiniCard({ label, value, suffix, isCyan = false }: { label: string; value: string; suffix?: string; isCyan?: boolean; }) {
    return (
        <Card className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between min-h-[75px]">
            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider leading-tight">{label}</span>
            <div className={cn(
                "text-2xl font-black font-mono leading-none tracking-tight flex items-center gap-1.5 mt-2",
                isCyan ? "text-cyan-500" : "text-foreground"
            )}>
                {value} {suffix && <span className="text-sm shrink-0">{suffix}</span>}
            </div>
        </Card>
    );
}