import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Flame, MapPin, TrendingUp, Trophy } from "lucide-react";
import { NoContextDashboard } from "@/components/platform/dashboard/no-context-dashboard";
import { headers } from "next/headers";
import {cn} from "@/lib/utils";

interface MembershipResponse {
    status: 'PENDING' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'CANCELLED' | 'REVOKED';
    initialRole: string;
    rfidTag?: string;
    planName?: string;
    expiryDate?: string;
    tenantName?: string;
}

interface AttendanceResponse {
    history: Array<{
        id: string;
        checkInTime: string;
        checkoutTime?: string;
    }>;
    monthlyCount: number;
    weeklyStreak: number;
    weeklyDistribution: Record<string, number>;
}

interface MetricResponse {
    id: string;
    metricType: string;
    data: {
        value: number;
        unit: string;
    };
    createdAt: string;
}

async function fetchBackend<T>(endpoint: string, jwtToken: string, tenantId: string): Promise<T | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 60 },
        });

        if (!res.ok) return null;
        return await res.json() as T;
    } catch (error) {
        console.error(`Backend fetch error on ${endpoint}:`, error);
        return null;
    }
}

export default async function GlobalDashboard() {
    const authData = await auth.api.getSession({ headers: await headers() });
    if (!authData) redirect("/login");

    const { user, session: sessionDetails } = authData;
    const bearerToken = sessionDetails.token;

    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id") || "";

    if (!tenantId) {
        return <NoContextDashboard />;
    }

    const [membership, attendanceData, metrics] = await Promise.all([
        fetchBackend<MembershipResponse>("/api/v1/members/me", bearerToken, tenantId),
        fetchBackend<AttendanceResponse>("/api/v1/attendances", bearerToken, tenantId),
        fetchBackend<MetricResponse[]>("/api/v1/metrics?metricType=PR", bearerToken, tenantId)
    ]);

    if (!membership || membership.status === "REVOKED") {
        redirect("/onboarding/link-gym");
    }

    const prCount = metrics?.length || 0;
    const monthlySessions = attendanceData?.monthlyCount || 0;
    const weeklyAverage = (monthlySessions / 4.3).toFixed(1);
    const dayStreak = attendanceData?.weeklyStreak || 0;
    const weeklyVisits = attendanceData?.weeklyDistribution || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-foreground">
            {/* 1. Header Section */}
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Good morning, {user.name?.split(' ')[0]}
                </h1>
            </div>

            {/* 2. Passport / Active Membership (Dynamic Theme Adaptive) */}
            <div className="relative overflow-hidden rounded-lg border border-border bg-card p-1 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                <div className="relative flex flex-col md:flex-row gap-6 p-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl italic">
                            {membership.tenantName?.substring(0, 2).toUpperCase() || "ST"}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    {membership.tenantName || "Partner Gym"} • {membership.status}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                                <div>PLAN <span className="text-foreground font-medium ml-1">{membership.planName || "Standard"}</span></div>
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
                        <Button variant="outline" className="rounded-sm border-border bg-background/50 hover:bg-accent hover:text-accent-foreground group-hover:border-primary/50 transition-all">
                            Check In <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    ) : (
                        <Button disabled variant="destructive" className="rounded-sm opacity-80">
                            Payment Required
                        </Button>
                    )}
                </div>
            </div>

            {/* 3. Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Sessions this month" value={monthlySessions.toString()} icon={<Calendar size={16} />} isPrimary={false} isEmerald={false} />
                <StatCard label="PRs logged" value={`${prCount} 🏆`} icon={<Trophy size={16} />} isPrimary={true} isEmerald={false} />
                <StatCard label="Avg / Week" value={weeklyAverage} icon={<TrendingUp size={16} />} isPrimary={false} isEmerald={true} />
            </div>

            {/* 4. Weekly Activity */}
            <Card className="bg-card border-border rounded-lg overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">This Week&apos;s Visits</h3>
                            <p className="text-xs text-muted-foreground/60 italic">Live Tracking</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 text-primary font-bold italic">
                                <Flame size={16} className="fill-current" /> {dayStreak}
                            </div>
                            <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">Day Streak</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between h-32 pt-4">
                        {Object.entries(weeklyVisits).map(([day, percentage]) => (
                            <ActivityBar
                                key={day}
                                height={`h-[${percentage}%]`}
                                day={day}
                                active={percentage > 0 && new Date().getDay() === getDayIndex(day)}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 5. Discovery Feed */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-lg font-bold italic uppercase tracking-tighter underline decoration-primary decoration-2 underline-offset-4">Explore Partner Gyms</h3>
                    <Button variant="link" className="text-primary text-xs p-0 h-auto">View Map</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    <GymDiscoveryCard name="TASS Colombo" vertical="High Performance" color="bg-primary/20 border-primary/10" dist="1.2 km" />
                    <GymDiscoveryCard name="Yoga Soul" vertical="Wellness" color="bg-muted border-border" dist="2.5 km" />
                    <GymDiscoveryCard name="The Box SL" vertical="CrossFit" color="bg-accent border-border" dist="4.0 km" />
                </div>
            </div>
        </div>
    );
}

function getDayIndex(dayStr: string): number {
    const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return days[dayStr] ?? -1;
}

// --- SUB-COMPONENTS ---

function StatCard({ label, value, icon, isPrimary, isEmerald }: { label: string, value: string, icon: any, isPrimary: boolean, isEmerald: boolean }) {
    return (
        <Card className="bg-card border-border rounded-lg p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em]">
                {icon} {label}
            </div>
            <div className={cn(
                "text-2xl font-black",
                isPrimary ? "text-primary" : isEmerald ? "text-emerald-500" : "text-foreground"
            )}>{value}</div>
        </Card>
    );
}

function ActivityBar({ height, day, active = false }: { height: string, day: string, active?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-3 w-full">
            <div className={cn(
                "w-10 rounded-sm transition-all duration-700",
                height,
                active ? 'bg-primary' : 'bg-primary/20 border border-primary/10'
            )} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{day}</span>
        </div>
    );
}

function GymDiscoveryCard({ name, vertical, color, dist }: { name: string, vertical: string, color: string, dist: string }) {
    return (
        <div className="min-w-[200px] bg-card border border-border rounded-lg p-4 space-y-3 shrink-0">
            <div className={cn("w-full h-24 rounded-md border", color)} />
            <div className="space-y-1">
                <p className="text-xs font-bold text-primary italic uppercase tracking-tighter">{vertical}</p>
                <h4 className="font-bold text-foreground">{name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                    <MapPin size={10} /> {dist} away
                </div>
            </div>
        </div>
    );
}