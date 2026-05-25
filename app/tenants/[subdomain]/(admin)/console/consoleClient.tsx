// app/tenants/[subdomain]/(admin)/console/consoleClient.tsx
"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, ArrowUpRight, CreditCard, MessageSquare, MonitorPlay, Settings, TrendingUp, UserPlus, Users, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {InviteMemberSheet} from "@/components/tenant/shared/InviteMemberSheet";

// --- API Schema Interfaces ---
interface PrismaTenantDto {
    id: string;
    name: string;
    slug: string;
    domain: string;
}

interface PrismaMembershipRoleDto {
    role: "ORG_ADMIN" | "MANAGER" | "TRAINER" | "MEMBER";
}

interface PrismaMembershipDto {
    status: string;
    tenant: PrismaTenantDto;
    roles: PrismaMembershipRoleDto[];
}

interface ExtendedUserResponseDto {
    id: string;
    memberships?: PrismaMembershipDto[];
}

interface ConsoleClientProps {
    subdomain: string;
}

const chartConfig = {
    revenue: {
        label: "Gross Revenue",
        color: "var(--primary)",
    }
} satisfies ChartConfig;

export default function ConsoleClient({ subdomain }: ConsoleClientProps) {
    // 1. Resolve Tenant Context Header parameter safely out of active window location metadata
    const tenantId = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("tenantId") || ""
        : "";

    // 2. Fetch profile matrix & execute RBAC gate assertions purely on the client thread
    const { data: userProfile, isLoading: profileLoading, isError: profileError } = useQuery<ExtendedUserResponseDto>({
        queryKey: ["adminProfileHandshake"],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/users/me", { method: "GET" });
            const data = await res.json();
            if (!res.ok) throw new Error("Clearance identity matrix rejected.");
            return data;
        }
    });

    const targetMembership = userProfile?.memberships?.find(m => m.tenant.id === tenantId || m.tenant.domain === subdomain);
    const hasAdminAccess = targetMembership?.roles.some(r => r.role === "ORG_ADMIN" || r.role === "MANAGER");

    // 3. Parallel Operational Admin Data Core Loader
    const { data: adminMetrics, isLoading: dataLoading } = useQuery({
        queryKey: ["consoleOperationalLedger", tenantId],
        queryFn: async () => {
            const [membersRes, invoicesRes, attendancesRes] = await Promise.all([
                striveClientFetch("/api/v1/members", { method: "GET", tenantId }),
                striveClientFetch("/api/v1/billing/invoices", { method: "GET", tenantId }),
                striveClientFetch("/api/v1/attendances", { method: "GET", tenantId })
            ]);

            return {
                members: membersRes.ok ? await membersRes.json() as any[] : [],
                invoices: invoicesRes.ok ? await invoicesRes.json() as any[] : [],
                attendances: attendancesRes.ok ? await attendancesRes.json() as any : { history: [], monthlyCount: 0 }
            };
        },
        enabled: !!tenantId && !!hasAdminAccess
    });

    // --- Analytics Processing state loops ---
    const metrics = useMemo(() => {
        const members = adminMetrics?.members || [];
        const invoices = adminMetrics?.invoices || [];
        const attendances = adminMetrics?.attendances || { history: [] };

        const active = members.filter((m: any) => m.status === 'ACTIVE').length;
        const grossReceivables = invoices.reduce((acc: number, inv: any) => {
            return acc + (inv.items?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || Number(inv.totalAmount) || 0);
        }, 0);

        const todayStr = new Date().toISOString().split('T')[0];
        const todayCheckins = attendances.history?.filter((a: any) => a.checkInTime?.startsWith(todayStr)).length || 0;
        const activeChurnRisk = members.filter((m: any) => m.status === 'GRACE_PERIOD' || m.status === 'SUSPENDED').length;

        return {
            activeMembers: active,
            monthlyRevenue: grossReceivables,
            todaysFootfall: todayCheckins > 0 ? todayCheckins : attendances.history.length,
            churnRisk: activeChurnRisk
        };
    }, [adminMetrics]);

    const chartData = useMemo(() => {
        return [
            { day: "Mon", revenue: metrics.monthlyRevenue * 0.10 },
            { day: "Tue", revenue: metrics.monthlyRevenue * 0.15 },
            { day: "Wed", revenue: metrics.monthlyRevenue * 0.12 },
            { day: "Thu", revenue: metrics.monthlyRevenue * 0.22 },
            { day: "Fri", revenue: metrics.monthlyRevenue * 0.25 },
            { day: "Sat", revenue: metrics.monthlyRevenue * 0.35 },
            { day: "Sun", revenue: metrics.monthlyRevenue * 0.42 },
        ];
    }, [metrics.monthlyRevenue]);

    if (profileLoading || (hasAdminAccess && dataLoading)) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-xs text-muted-foreground font-bold uppercase tracking-widest gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Initializing Terminal Security Matrix...
            </div>
        );
    }

    if (profileError || !targetMembership || targetMembership.status === "REVOKED") {
        return (
            <div className="rounded-xl border border-destructive/10 bg-destructive/5 p-8 text-center max-w-md mx-auto space-y-3">
                <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
                <h3 className="font-bold text-sm text-foreground uppercase tracking-tight">Security Clearence Failure</h3>
                <p className="text-xs text-muted-foreground">No active organizational authorization token found linking you to this environment scope.</p>
            </div>
        );
    }

    if (!hasAdminAccess) {
        return (
            <div className="rounded-xl border border-destructive/10 bg-destructive/5 p-8 text-center max-w-md mx-auto space-y-3">
                <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
                <h3 className="font-bold text-sm text-foreground uppercase tracking-tight">Access Control Block</h3>
                <p className="text-xs text-muted-foreground">Insufficient authorization footprints. Administrative control panels are locked out from consumer accounts.</p>
            </div>
        );
    }

    const members = adminMetrics?.members || [];
    const invoices = adminMetrics?.invoices || [];
    const attendances = adminMetrics?.attendances || { history: [], monthlyCount: 0 };
    const tenantName = targetMembership.tenant.name;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-foreground">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Operator Workspace</p>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">{tenantName}</h1>
                </div>
                <div>
                    <Link href={`/settings`}>
                        <Button variant="outline" className="h-10 border-border bg-card rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground text-xs font-semibold gap-2">
                            <Settings className="w-3.5 h-3.5"/> Facility Settings
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard title="Active Subscriptions" value={metrics.activeMembers.toLocaleString()} description="Live linked user profiles" icon={<Users className="w-4 h-4 text-muted-foreground"/>} />
                <AdminStatCard title="Gross Receivables" value={`LKR ${metrics.monthlyRevenue.toLocaleString()}`} description="Calculated ledger total" icon={<CreditCard className="w-4 h-4 text-muted-foreground"/>} />
                <AdminStatCard title="Check-ins Today" value={metrics.todaysFootfall.toString()} description="Active hardware logging" icon={<Activity className="w-4 h-4 text-muted-foreground"/>} />
                <AdminStatCard title="Churn Risk" value={metrics.churnRisk.toString()} description="Grace & suspended status" icon={<AlertTriangle className="w-4 h-4 text-destructive"/>} isAlert={metrics.churnRisk > 0} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    {/* Revenue Time-Series Chart */}
                    <Card className="bg-card border-border rounded-lg p-6">
                        <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Revenue Stream</CardTitle>
                                <CardDescription className="text-muted-foreground/60 text-xs">Weekly billing lifecycle distribution</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10">
                                <TrendingUp className="w-3 h-3"/> +14.2%
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ChartContainer config={chartConfig} className="h-[280px] w-full">
                                <LineChart data={chartData} accessibilityLayer margin={{ left: -12, right: 12 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false}/>
                                    <XAxis dataKey="day" stroke="currentColor" className="text-muted-foreground" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis stroke="currentColor" className="text-muted-foreground" tickLine={false} axisLine={false} tickMargin={8} />
                                    <ChartTooltip content={<ChartTooltipContent/>}/>
                                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Live Ingress Activity Stream */}
                    <Card className="bg-card border-border rounded-lg p-6">
                        <div className="flex items-center justify-between pb-4">
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Activity Feed</h3>
                                <p className="text-xs text-muted-foreground/60">Live hardware ingress and check-in verifications</p>
                            </div>
                        </div>
                        <div className="border border-border rounded-md overflow-hidden bg-background/40">
                            <Table>
                                <TableHeader className="bg-background border-b border-border">
                                    <TableRow className="border-b border-border hover:bg-transparent">
                                        <TableHead className="text-muted-foreground text-xs">Verification Target</TableHead>
                                        <TableHead className="text-muted-foreground text-xs">Method</TableHead>
                                        <TableHead className="text-muted-foreground text-xs text-right">Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendances.history.slice(0, 5).map((log: any, idx: number) => (
                                        <TableRow key={log.id || idx} className="border-b border-border hover:bg-accent/40">
                                            <TableCell className="font-medium py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                                                    <span className="font-bold text-foreground">
                                                        {log.membershipId ? `Member [${log.membershipId.slice(0, 8)}]` : "Hardware Ingress Pass"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-mono">
                                                <span className="bg-background px-2 py-0.5 border border-border rounded-sm">{log.authMethod || "RFID"}</span>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground/80 text-xs font-mono">
                                                {new Date(log.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {attendances.history.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">No live ingress logs detected in current lifecycle.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Operator Commands Column */}
                <div className="space-y-6">
                    <Card className="bg-card border border-border rounded-lg p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-60 pointer-events-none"/>
                        <div className="relative space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">COMMAND CENTER</h3>
                                <p className="text-xs text-muted-foreground">Manage daily gym operations and POS.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {/* Wrap the button directly in the reusable sheet */}
                                <InviteMemberSheet tenantId={tenantId}>
                                    <CommandButton label="Onboard Member" icon={<UserPlus className="w-4 h-4"/>} />
                                </InviteMemberSheet>

                                <CommandButton label="Log Cash Payment" icon={<CreditCard className="w-4 h-4"/>} onClick={() => toast.success("Accessing local cash engine...")} />
                                <CommandButton label="Front Desk Mode" icon={<MonitorPlay className="w-4 h-4"/>} onClick={() => toast.success("Launching check-in monitor...")} />
                                <CommandButton label="Broadcast SMS" icon={<MessageSquare className="w-4 h-4"/>} onClick={() => toast.info("Initializing transaction SMS client...")} />
                            </div>
                        </div>
                    </Card>

                    {/* Directory Quick Sight */}
                    <Card className="bg-card border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Signups</h2>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground p-0">
                                Directory <ArrowUpRight className="w-3 h-3 ml-1"/>
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {members.slice(0, 4).map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-background/60 rounded-md border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black">
                                            {member.user?.firstName?.[0] || "M"}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-xs text-foreground">{member.user?.firstName || "Stride"} {member.user?.lastName || "Member"}</p>
                                            <p className="text-[9px] font-mono font-bold tracking-wider uppercase text-muted-foreground/80">{member.status}</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded-sm border border-border">{member.rfidTag || "NO RFID"}</span>
                                </div>
                            ))}
                            {members.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-6">No records matched active tenant scoping.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- Dynamic Sub Component Containers ---

function AdminStatCard({ title, value, description, icon, isAlert = false }: { title: string; value: string; description: string; icon: React.ReactNode; isAlert?: boolean }) {
    return (
        <Card className={cn(
            "bg-card border-border rounded-lg p-5 flex flex-col gap-4 transition-all hover:border-muted-foreground/20",
            isAlert && "ring-1 ring-destructive/20 bg-destructive/5"
        )}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
                <div className="p-2 bg-background rounded-md border border-border">{icon}</div>
            </div>
            <div className="space-y-0.5">
                <div className="text-2xl font-black text-foreground tracking-tight font-mono">{value}</div>
                <div className="text-[11px] text-muted-foreground font-medium">{description}</div>
            </div>
        </Card>
    );
}

// Refactored to forwardRef so it works perfectly inside <SheetTrigger asChild>
const CommandButton = React.forwardRef<HTMLButtonElement, { label: string; icon: React.ReactNode; onClick?: () => void; className?: string }>(
    ({ label, icon, onClick, className, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                onClick={onClick}
                variant="outline"
                className={cn("h-14 w-full bg-background border border-border hover:border-primary/40 hover:bg-accent flex flex-col items-center justify-center gap-1 rounded-md transition-all group p-2 text-foreground", className)}                {...props}
            >
                <span className="text-muted-foreground group-hover:text-primary transition-colors duration-200">{icon}</span>
                <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground group-hover:text-foreground transition-colors duration-200">{label}</span>
            </Button>
        );
    }
);
CommandButton.displayName = "CommandButton";