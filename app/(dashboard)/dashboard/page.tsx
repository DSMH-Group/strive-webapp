import {auth} from "@/lib/auth";
import {redirect} from "next/navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {ArrowRight, Calendar, Flame, MapPin, TrendingUp, Trophy} from "lucide-react";
import {NoContextDashboard} from "@/components/dashboard/no-context-dashboard";

// 1. Define strict TypeScript interfaces matching our NestJS OpenApi DTOs
interface MembershipResponse {
    status: 'PENDING' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'CANCELLED' | 'REVOKED';
    initialRole: string;
    rfidTag?: string;
    planName?: string;       // Custom metadata fields injected on backend
    expiryDate?: string;     // Custom metadata fields injected on backend
    tenantName?: string;     // Resolved gym name
}

interface AttendanceResponse {
    history: Array<{
        id: string;
        checkInTime: string;
        checkoutTime?: string;
    }>;
    monthlyCount: number;
    weeklyStreak: number;
    weeklyDistribution: Record<string, number>; // e.g., { Mon: 40, Tue: 30 ... }
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

// Helper to make secure server-to-server calls to our NestJS Monolith
async function fetchBackend<T>(endpoint: string, jwtToken: string, tenantId: string): Promise<T | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: {revalidate: 60}, // Cache data for 1 minute to save mobile bandwidth
        });

        if (!res.ok) return null;
        return await res.json() as T;
    } catch (error) {
        console.error(`Backend fetch error on ${endpoint}:`, error);
        return null;
    }
}

export default async function GlobalDashboard() {
    // 1. Fetch the raw session payload from better-auth
    const authData = await auth.api.getSession({headers: await headers()});
    if (!authData) redirect("/login");

    // 2. Destructure accurately according to better-auth's type definition
    const {user, session: sessionDetails} = authData;

    // 3. Extract the bearer token to communicate with the NestJS Core API
    const bearerToken = sessionDetails.token;

    // 4. Extract tenant ID from Edge Middleware headers
    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id") || "";

    if (!tenantId) {
        return <NoContextDashboard/>;
    }

    // 5. Pass 'bearerToken' into your fetch backend calls
    const [membership, attendanceData, metrics] = await Promise.all([
        fetchBackend<MembershipResponse>("/api/v1/members/me", bearerToken, tenantId),
        fetchBackend<AttendanceResponse>("/api/v1/attendances", bearerToken, tenantId),
        fetchBackend<MetricResponse[]>("/api/v1/metrics?metricType=PR", bearerToken, tenantId)
    ]);

    // Fallback UI or Redirects based on business requirements
    if (!membership || membership.status === "REVOKED") {
        redirect("/onboarding/link-gym");
    }

    // Parse values safely with sensible defaults
    const prCount = metrics?.length || 0;
    const monthlySessions = attendanceData?.monthlyCount || 0;
    const weeklyAverage = (monthlySessions / 4.3).toFixed(1);
    const dayStreak = attendanceData?.weeklyStreak || 0;
    const weeklyVisits = attendanceData?.weeklyDistribution || {Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0};

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Header Section */}
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
                </p>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Good morning, {user.name?.split(' ')[0]}
                </h1>
            </div>

            {/* 2. Passport / Active Membership (Dynamic Theme Adaptive) */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 p-1 group">
                <div
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50"/>
                <div
                    className="relative flex flex-col md:flex-row gap-6 p-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div
                            className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-primary font-black text-2xl italic">
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
                                <div>PLAN <span
                                    className="text-white font-medium ml-1">{membership.planName || "Standard"}</span>
                                </div>
                                <div>EXPIRES <span className="text-white font-medium ml-1">
                                    {membership.expiryDate ? new Date(membership.expiryDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    }) : "N/A"}
                                </span></div>
                            </div>
                        </div>
                    </div>

                    {/* Status Gated Interaction: Prevent check-in if account is GRACE_PERIOD or SUSPENDED */}
                    {membership.status === "ACTIVE" ? (
                        <Button variant="outline"
                                className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 group-hover:border-primary/50 transition-all">
                            Check In <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                    ) : (
                        <Button disabled variant="destructive" className="rounded-xl opacity-80">
                            Payment Required
                        </Button>
                    )}
                </div>
            </div>

            {/* 3. Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Sessions this month" value={monthlySessions.toString()} icon={<Calendar size={16}/>}
                          color="text-white"/>
                <StatCard label="PRs logged" value={`${prCount} 🏆`} icon={<Trophy size={16}/>} color="text-primary"/>
                <StatCard label="Avg / Week" value={weeklyAverage} icon={<TrendingUp size={16}/>}
                          color="text-emerald-500"/>
            </div>

            {/* 4. Weekly Activity */}
            <Card className="bg-zinc-900 border-white/5 rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">This
                                Week&apos;s Visits</h3>
                            <p className="text-xs text-zinc-500 italic">Live Tracking</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 text-primary font-bold italic">
                                <Flame size={16} className="fill-current"/> {dayStreak}
                            </div>
                            <span
                                className="text-[10px] uppercase tracking-tighter text-muted-foreground">Day Streak</span>
                        </div>
                    </div>

                    {/* Bar Chart mapping directly to processed backend history */}
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

            {/* 5. Discovery Feed (Kept client-side optimized or static for now) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-lg font-bold italic uppercase tracking-tighter underline decoration-primary decoration-2 underline-offset-4">Explore
                        Partner Gyms</h3>
                    <Button variant="link" className="text-primary text-xs">View Map</Button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    <GymDiscoveryCard name="TASS Colombo" vertical="High Performance" color="bg-blue-500"
                                      dist="1.2 km"/>
                    <GymDiscoveryCard name="Yoga Soul" vertical="Wellness" color="bg-purple-500" dist="2.5 km"/>
                    <GymDiscoveryCard name="The Box SL" vertical="CrossFit" color="bg-zinc-100" dist="4.0 km"/>
                </div>
            </div>
        </div>
    );
}

function getDayIndex(dayStr: string): number {
    const days: Record<string, number> = {Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6};
    return days[dayStr] ?? -1;
}

// --- SUB-COMPONENTS ---

function StatCard({label, value, icon, color}: { label: string, value: string, icon: any, color: string }) {
    return (
        <Card className="bg-zinc-900 border-white/5 rounded-2xl p-6 flex flex-col gap-2">
            <div
                className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em]">
                {icon} {label}
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
        </Card>
    );
}

function ActivityBar({height, day, active = false}: { height: string, day: string, active?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-3 w-full">
            <div
                className={`w-10 ${height} rounded-lg transition-all duration-700 ${active ? 'bg-primary' : 'bg-orange-500/20'}`}/>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{day}</span>
        </div>
    );
}

function GymDiscoveryCard({name, vertical, color, dist}: {
    name: string,
    vertical: string,
    color: string,
    dist: string
}) {
    return (
        <div className="min-w-[200px] bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-3 shrink-0">
            <div className={`w-full h-24 rounded-xl ${color} opacity-20`}/>
            <div className="space-y-1">
                <p className="text-xs font-bold text-primary italic uppercase tracking-tighter">{vertical}</p>
                <h4 className="font-bold">{name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                    <MapPin size={10}/> {dist} away
                </div>
            </div>
        </div>
    );
}