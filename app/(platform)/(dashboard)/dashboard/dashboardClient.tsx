// app/(platform)/(dashboard)/dashboard/dashboardClient.tsx
"use client";

import React from "react";
import {useQuery} from "@tanstack/react-query";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {AlertCircle, ArrowRight, Calendar, Flame, LayoutGrid, Loader2, MapPin, TrendingUp, Trophy} from "lucide-react";
import {NoContextDashboard} from "@/components/platform/dashboard/no-context-dashboard";
import {striveClientFetch} from "@/lib/api";
import {cn} from "@/lib/utils";

interface PrismaTenantDto {
    id: string;
    name: string;
    slug: string;
    domain?: string | null;
}

interface PrismaMembershipRoleDto {
    id: string;
    membershipId: string;
    role: "ORG_ADMIN" | "MANAGER" | "TRAINER" | "MEMBER";
}

interface PrismaMembershipDto {
    id: string;
    userId: string;
    tenantId: string;
    status: 'PENDING' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'CANCELLED' | 'REVOKED';
    tenant: PrismaTenantDto;
    roles: PrismaMembershipRoleDto[];
    planName?: string;
    expiryDate?: string;
    tenantName?: string;
}

interface ExtendedUserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    memberships?: PrismaMembershipDto[];
}

interface MembershipResponse {
    status: 'PENDING' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'CANCELLED' | 'REVOKED';
    initialRole: string;
    rfidTag?: string;
    planName?: string;
    expiryDate?: string;
    tenantName?: string;
}

interface AttendanceResponse {
    history: Array<{ id: string; checkInTime: string; checkoutTime?: string }>;
    monthlyCount: number;
    weeklyStreak: number;
    weeklyDistribution: Record<string, number>;
}

interface MetricResponse {
    id: string;
    metricType: string;
    data: { value: number; unit: string };
    createdAt: string;
}

interface GlobalDashboardClientProps {
    initialUser: { name: string; email: string };
}

export default function GlobalDashboardClient({initialUser}: GlobalDashboardClientProps) {
    const tenantId = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("tenantId") || ""
        : "";

    const {data: userProfile, isLoading: profileLoading, isError: profileError} = useQuery<ExtendedUserResponseDto>({
        queryKey: ["clientProfile"],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/users/me", {method: "GET"});
            if (!res.ok) throw new Error("Could not fetch unified profile data.");
            return res.json();
        }
    });

    const adminMembership = userProfile?.memberships?.find(membership =>
        membership.roles.some(roleObj => roleObj.role === "ORG_ADMIN")
    );

    const ownedGym = adminMembership ? adminMembership.tenant : null;

    const {data: dashboardData, isLoading: metricsLoading} = useQuery({
        queryKey: ["dashboardMetrics", tenantId],
        queryFn: async () => {
            const [membershipRes, attendanceRes, metricsRes] = await Promise.all([
                striveClientFetch("/api/v1/members/me", {method: "GET", tenantId}),
                striveClientFetch("/api/v1/attendances", {method: "GET", tenantId}),
                striveClientFetch("/api/v1/metrics?metricType=PR", {method: "GET", tenantId})
            ]);

            if (!membershipRes.ok) throw new Error("Membership boundary verification failure.");

            return {
                membership: await membershipRes.json() as MembershipResponse,
                attendance: await attendanceRes.json() as AttendanceResponse,
                metrics: await metricsRes.json() as MetricResponse[]
            };
        },
        enabled: !!tenantId
    });

    if (profileLoading || (tenantId && metricsLoading)) {
        return (
            <div
                className="flex flex-col items-center justify-center py-32 text-xs text-muted-foreground font-bold uppercase tracking-widest gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary"/> Resolving Ecosystem Context Matrix...
            </div>
        );
    }

    if (profileError) {
        return (
            <div
                className="rounded-xl border border-destructive/10 bg-destructive/5 p-8 text-center max-w-md mx-auto space-y-3">
                <AlertCircle className="w-6 h-6 text-destructive mx-auto"/>
                <p className="text-sm text-muted-foreground">Failed to establish structural handshake authentication
                    validation rules.</p>
            </div>
        );
    }

    if (!tenantId) {
        if (ownedGym) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const urlObj = new URL(appUrl);
            const adminUrl = `${urlObj.protocol}//${ownedGym.slug}.${urlObj.host}/console`;

            return (
                <div className=" mx-auto py-6 space-y-8 animate-in fade-in duration-500">
                    <Card className="bg-card border-border rounded-lg overflow-hidden relative p-8">
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"/>
                        <div
                            className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div
                                    className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                                    <LayoutGrid size={12}/> Workspace Hub
                                </div>
                                <h2 className="text-2xl font-black tracking-tight uppercase italic text-foreground">{ownedGym.name}</h2>
                                <p className="text-sm text-muted-foreground max-w-xl">
                                    Your multi-tenant cloud workspace infrastructure is active. Click below to enter
                                    your dedicated management control panel dashboard.
                                </p>
                            </div>
                            <Button
                                className="h-11 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-bold text-xs uppercase tracking-tight gap-2 shrink-0">
                                <a href={adminUrl}>
                                    Go to Admin Panel <ArrowRight size={14}/>
                                </a>
                            </Button>
                        </div>
                    </Card>
                    <NoContextDashboard hideOnboardingBanner/>
                </div>
            );
        }

        return <NoContextDashboard/>;
    }

    const membership = dashboardData?.membership;
    const attendanceData = dashboardData?.attendance;
    const metrics = dashboardData?.metrics;

    if (!membership || membership.status === "REVOKED") {
        window.location.href = "/onboarding/link-gym";
        return null;
    }

    const prCount = metrics?.length || 0;
    const monthlySessions = attendanceData?.monthlyCount || 0;
    const weeklyAverage = (monthlySessions / 4.3).toFixed(1);
    const dayStreak = attendanceData?.weeklyStreak || 0;
    const weeklyVisits = attendanceData?.weeklyDistribution || {Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0};
    const days = {Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6};

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-foreground">
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
                </p>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                    Good morning, {initialUser.name.split(' ')[0]}
                </h1>
            </div>

            {/* Passport Card */}
            <div className="relative overflow-hidden rounded-lg border border-border bg-card p-1 group">
                <div
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50"/>
                <div
                    className="relative flex flex-col md:flex-row gap-6 p-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div
                            className="w-16 h-16 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl italic">
                            {membership.tenantName?.substring(0, 2).toUpperCase() || "ST"}
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                {membership.tenantName || "Partner Gym"} • {membership.status}
                            </span>
                            <h2 className="text-2xl font-bold text-foreground">{initialUser.name}</h2>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                                <div>PLAN <span
                                    className="text-foreground font-medium ml-1">{membership.planName || "Standard"}</span>
                                </div>
                                <div>EXPIRES <span className="text-foreground font-medium ml-1">
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
                        <Button variant="outline"
                                className="rounded-md border-border bg-background hover:bg-accent hover:text-accent-foreground transition-all text-xs uppercase font-bold tracking-tight h-10 px-5">
                            Check In <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                    ) : (
                        <Button disabled variant="destructive"
                                className="rounded-md opacity-80 text-xs uppercase font-bold tracking-tight h-10 px-5">
                            Payment Required
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border rounded-lg p-6 flex flex-col gap-2">
                    <div
                        className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em]">
                        <Calendar size={16}/> Sessions this month
                    </div>
                    <div className="text-2xl font-black text-foreground">{monthlySessions}</div>
                </Card>
                <Card className="bg-card border-border rounded-lg p-6 flex flex-col gap-2">
                    <div
                        className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em]">
                        <Trophy size={16}/> PRs logged
                    </div>
                    <div className="text-2xl font-black text-primary">{prCount} 🏆</div>
                </Card>
                <Card className="bg-card border-border rounded-lg p-6 flex flex-col gap-2">
                    <div
                        className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em]">
                        <TrendingUp size={16}/> Avg / Week
                    </div>
                    <div className="text-2xl font-black text-emerald-500">{weeklyAverage}</div>
                </Card>
            </div>

            {/* Attendance Chart */}
            <Card className="bg-card border-border rounded-lg overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">This
                                Week&apos;s Visits</h3>
                            <p className="text-xs text-muted-foreground/60 italic">Live Tracking</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 text-primary font-bold italic"><Flame size={16}
                                                                                                          className="fill-current"/> {dayStreak}
                            </div>
                            <span
                                className="text-[10px] uppercase tracking-tighter text-muted-foreground">Day Streak</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between h-32 pt-4">
                        {Object.entries(weeklyVisits).map(([day, percentage]) => (
                            <div key={day} className="flex flex-col items-center gap-3 w-full">
                                <div style={{height: `${percentage}%`}}
                                     className={cn("w-10 rounded-sm transition-all duration-700", percentage > 0 && new Date().getDay() === (days[day as keyof typeof days] ?? -1) ? 'bg-primary' : 'bg-primary/20 border border-primary/10')}/>
                                <span
                                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{day}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Discovery Feed */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-lg font-bold italic uppercase tracking-tighter underline decoration-primary decoration-2 underline-offset-4 text-foreground">Explore
                        Partner Gyms</h3>
                    <Button variant="link" className="text-primary text-xs p-0 h-auto font-bold uppercase">View
                        Map</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    <div className="min-w-[200px] bg-card border border-border rounded-lg p-4 space-y-3 shrink-0">
                        <div className="w-full h-24 rounded-md border bg-primary/10 border-primary/20"/>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-primary italic uppercase tracking-tighter">High
                                Performance</p>
                            <h4 className="font-bold text-foreground">TASS Colombo</h4>
                            <div
                                className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                                <MapPin size={10}/> 1.2 km away
                            </div>
                        </div>
                    </div>
                    <div className="min-w-[200px] bg-card border border-border rounded-lg p-4 space-y-3 shrink-0">
                        <div className="w-full h-24 rounded-md border bg-muted border-border"/>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-primary italic uppercase tracking-tighter">Wellness</p>
                            <h4 className="font-bold text-foreground">Yoga Soul</h4>
                            <div
                                className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                                <MapPin size={10}/> 2.5 km away
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}