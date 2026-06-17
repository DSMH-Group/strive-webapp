// app/tenants/[subdomain]/(admin)/trainer/clients/[clientId]/ClientDetailClient.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { striveClientFetch } from "@/lib/api";
import { AlertCircle, ArrowLeft, Calendar, Loader2, Mail, Phone, CreditCard, Receipt, Dumbbell, Activity, ClipboardList, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function ClientDetailClient({ tenantId, clientId }: { tenantId: string, clientId: string }) {

    // 🚀 1. Fetch Core Client & Membership Data
    const { data: client, isLoading: isClientLoading } = useQuery({
        queryKey: ["clientDetail", clientId],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/members/${clientId}`, {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to fetch client data");
            return res.json();
        }
    });

    // 🚀 2. Fetch Client Financial Ledger (Invoices)
    const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
        queryKey: ["clientInvoices", clientId],
        queryFn: async () => {
            // Using the endpoint we created in the BillingController
            const res = await striveClientFetch(`/api/v1/billing/invoices?membershipId=${clientId}`, {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to fetch client invoices");
            return res.json();
        }
    });

    if (isClientLoading || isInvoicesLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-xs font-bold uppercase tracking-widest text-muted-foreground gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Synchronizing Client Profile...
            </div>
        );
    }

    if (!client) return <Placeholder text="Client profile could not be loaded." />;

    const isPending = client.status === "PENDING";
    const isActive = client.status === "ACTIVE";

    return (
        <div className="space-y-6 text-foreground select-none animate-in fade-in duration-500 pb-20">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Link href="../clients" className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <ArrowLeft size={14} /> Back to Directory
                </Link>
            </div>

            {/* Header: Identity Card */}
            <Card className="p-6 bg-card border border-border rounded-[1.5rem] shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-2xl text-primary shrink-0 shadow-inner">
                            {client.user?.firstName?.[0] || ""}{client.user?.lastName?.[0] || ""}
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight">{client.user?.firstName} {client.user?.lastName}</h1>
                                <span className={cn(
                                    "text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded border tracking-wide",
                                    isActive && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                    isPending && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                    (!isActive && !isPending) && "bg-muted text-muted-foreground border-border"
                                )}>
                                    {client.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Phone size={13} /> {client.user?.phone || "No Phone"}</span>
                                <span className="flex items-center gap-1.5"><Mail size={13} /> {client.user?.email || "No Email"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button variant="secondary" className="bg-muted hover:bg-accent text-xs font-bold h-10 px-4 rounded-xl flex-1 md:flex-none">
                            Log Session
                        </Button>
                        <Button className="text-xs font-bold h-10 px-4 rounded-xl flex-1 md:flex-none">
                            + New Program
                        </Button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 border-t border-border pt-6">
                    <Metric label="Active Plan" value={client.activePlan?.name || "Pay-As-You-Go"} />
                    <Metric label="Total Sessions" value={client.sessionsCount || 0} mono />
                    <Metric label="Tokens Left" value={client.tokensLeft || 0} mono
                            valueClass={client.tokensLeft <= 3 ? "text-amber-500" : "text-foreground"} />
                    <Metric label="Body Weight" value={client.weight ? `${client.weight} kg` : "N/A"} mono />
                    <Metric label="This Month" value={`${client.monthlySessions || 0} sess`} mono />
                </div>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none p-0 h-auto gap-6 flex-wrap">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-none">Overview</TabsTrigger>
                    <TabsTrigger value="workouts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-none">Workouts</TabsTrigger>
                    <TabsTrigger value="progress" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-none">Progress</TabsTrigger>
                    <TabsTrigger value="sessions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-none">Sessions</TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-none">Notes</TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-none flex items-center gap-1.5"><CreditCard size={14}/> Billing & Ledger</TabsTrigger>
                </TabsList>

                {/* =========================================
                    TAB: OVERVIEW
                ========================================= */}
                <TabsContent value="overview" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 outline-none">
                    <div className="md:col-span-2 space-y-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block pl-2">Recent Sessions</span>
                        {client.recentSessions?.length > 0 ? client.recentSessions.map((s: any) => (
                            <Card key={s.id} className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-xl text-primary">
                                            <Activity size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{s.name}</h4>
                                            <span className="text-xs text-muted-foreground font-mono">{s.date} · {s.duration} min</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{s.summary}</p>
                            </Card>
                        )) : <Placeholder text="No recent session data logged." icon={<Activity className="w-8 h-8 opacity-20" />} />}
                    </div>

                    <div className="md:col-span-1 space-y-6">
                        <Card className="p-6 bg-card border border-border rounded-2xl">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-3 mb-4">Subscription Status</span>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Renews</span>
                                    <span className="font-mono font-bold">{client.activePlan?.endDate || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Auto-Renew</span>
                                    <span className="font-bold">{client.autoRenewEnabled ? "Enabled" : "Disabled"}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-border">
                                    <span className="text-muted-foreground font-medium">Sessions Left</span>
                                    <span className={cn("font-mono font-black", (client.tokensLeft || 0) <= 3 ? "text-amber-500" : "text-primary")}>
                                        {client.tokensLeft || 0} tokens
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-card border border-border rounded-2xl">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-3 mb-4">Next Scheduled</span>
                            {client.nextSession ? (
                                <div className="flex items-center gap-3 text-primary">
                                    <div className="bg-primary/10 p-2.5 rounded-xl">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold font-mono tracking-tight">{client.nextSession.date}</p>
                                        <p className="text-muted-foreground text-xs font-medium">at {client.nextSession.time}</p>
                                    </div>
                                </div>
                            ) : <p className="text-xs text-muted-foreground italic">No upcoming sessions scheduled.</p>}
                        </Card>
                    </div>
                </TabsContent>

                {/* =========================================
                    TAB: WORKOUTS
                ========================================= */}
                <TabsContent value="workouts" className="mt-6 space-y-6 outline-none">
                    {client.activeProgram ? (
                        <>
                            <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary p-3 rounded-xl text-primary-foreground shadow-sm">
                                            <ClipboardList size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Active Program</span>
                                            <h2 className="text-xl font-black tracking-tight">{client.activeProgram.name}</h2>
                                            <p className="text-xs text-muted-foreground mt-1">Goal: <span className="font-medium text-foreground">{client.activeProgram.goal}</span></p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold border-border">Reassign Program</Button>
                                </div>

                                <div className="flex items-center justify-between text-xs font-bold mb-2">
                                    <span className="text-muted-foreground">Week {client.activeProgram.currentWeek} of {client.activeProgram.totalWeeks}</span>
                                    <span className="text-primary">{Math.round((client.activeProgram.currentWeek / client.activeProgram.totalWeeks) * 100)}%</span>
                                </div>
                                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary h-full rounded-full transition-all duration-500 ease-in-out"
                                        style={{ width: `${(client.activeProgram.currentWeek / client.activeProgram.totalWeeks) * 100}%` }}
                                    />
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {client.activeProgram.routines?.map((routine: any) => (
                                    <Card key={routine.id} className="p-5 bg-card border border-border rounded-2xl flex flex-col h-full">
                                        <h3 className="font-black text-sm tracking-tight mb-4 border-b border-border pb-3">{routine.dayName}</h3>
                                        <div className="flex flex-col gap-2.5 flex-1">
                                            {routine.exercises?.map((ex: any, i: number) => (
                                                <div key={i} className="bg-background border border-border px-4 py-3 rounded-xl flex items-center justify-between group hover:border-primary/40 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Dumbbell size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                        <span className="font-bold text-sm tracking-tight">{ex.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] uppercase font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">{ex.muscleGroup}</span>
                                                        <span className="text-xs font-mono font-black">{ex.sets} × {ex.reps}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!routine.exercises || routine.exercises.length === 0) && (
                                                <span className="text-xs text-muted-foreground italic mt-2">Rest day or no exercises assigned.</span>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Placeholder text="No active training program assigned to this client." icon={<ClipboardList className="w-8 h-8 opacity-20" />} />
                    )}
                </TabsContent>

                {/* =========================================
                    TAB: PROGRESS
                ========================================= */}
                <TabsContent value="progress" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 outline-none">
                    <Card className="p-6 bg-card border border-border rounded-2xl">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-3 mb-6">Body Weight Trend</span>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={client.weightTrend || []}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="week" stroke="#888" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                                    <YAxis domain={['auto', 'auto']} stroke="#888" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}kg`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px', fontWeight: 'bold' }}
                                        itemStyle={{ color: 'hsl(var(--primary))' }}
                                    />
                                    <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-6 bg-card border border-border rounded-2xl">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-3 mb-4">Personal Records</span>
                        <div className="space-y-3">
                            {client.personalRecords?.length > 0 ? client.personalRecords.map((pr: any) => (
                                <div key={pr.exercise} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <TrendingUp size={16} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{pr.exercise}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-black text-lg">{pr.weight} kg</p>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">+{pr.gain} kg PR</p>
                                    </div>
                                </div>
                            )) : <p className="text-xs text-muted-foreground italic mt-4">No personal records logged yet.</p>}
                        </div>
                    </Card>
                </TabsContent>

                {/* =========================================
                    TAB: SESSIONS
                ========================================= */}
                <TabsContent value="sessions" className="mt-6 space-y-6 outline-none">
                    {(client.tokensLeft ?? 0) <= 3 && (
                        <Card className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    <div>
                                        <h3 className="font-bold text-amber-500 tracking-tight">Low Session Tokens</h3>
                                        <p className="text-xs text-amber-600 mt-0.5">This client only has {client.tokensLeft} sessions remaining.</p>
                                    </div>
                                </div>
                                <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold h-9 px-4 rounded-xl">
                                    Remind Client
                                </Button>
                            </div>
                        </Card>
                    )}

                    <Card className="bg-card border border-border rounded-[1.5rem] p-6 space-y-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-2">Session History</span>
                        <div className="border border-border rounded-xl overflow-hidden bg-background">
                            <Table>
                                <TableHeader className="bg-muted/50 border-b border-border">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3 pl-5 w-28">Date</TableHead>
                                        <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3 w-32">Type</TableHead>
                                        <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3">Summary</TableHead>
                                        <TableHead className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground py-3 w-24 text-right">Duration</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {client.sessions?.map((session: any) => (
                                        <TableRow key={session.id} className="border-b border-border last:border-0 hover:bg-accent group transition-colors duration-150">
                                            <TableCell className="py-4 pl-5 font-mono text-xs font-bold text-muted-foreground">
                                                {session.date}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded">
                                                    {session.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <p className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{session.exercisesSummary}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{session.notes}</p>
                                            </TableCell>
                                            <TableCell className="py-4 text-right font-mono text-xs font-bold text-muted-foreground">
                                                {session.duration}m
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!client.sessions || client.sessions.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs italic">
                                                No sessions have been logged for this client yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* =========================================
                    TAB: BILLING & LEDGER (NEW)
                ========================================= */}
                <TabsContent value="billing" className="mt-6 space-y-6 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-3 mb-4">Financial Status</span>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-1">Current Membership</p>
                                        <p className="text-lg font-black tracking-tight">{client.activePlan?.name || "No Active Plan"}</p>
                                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{client.activePlan ? `LKR ${Number(client.activePlan.monthlyPrice).toLocaleString()}/mo` : "Pay-As-You-Go"}</p>
                                    </div>
                                    <div className="pt-4 border-t border-border">
                                        <p className="text-xs text-muted-foreground font-medium mb-1">Payment Method</p>
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            <CreditCard size={16} className="text-muted-foreground" />
                                            {client.hasSavedCard ? "Card Saved (Auto-Pay Ready)" : "No Card Saved"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-card border border-border rounded-2xl">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-3 mb-4">Ledger Actions</span>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start text-xs font-bold h-11 rounded-xl border-border hover:border-primary/50 gap-3">
                                    <Receipt size={16} className="text-muted-foreground"/> Generate Manual Invoice
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-xs font-bold h-11 rounded-xl border-border hover:border-primary/50 gap-3">
                                    <CreditCard size={16} className="text-muted-foreground"/> Reconcile Offline Payment
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <Card className="bg-card border border-border rounded-[1.5rem] p-6 space-y-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-2">Client Invoice History</span>
                        <div className="border border-border rounded-xl overflow-hidden bg-background">
                            <Table>
                                <TableBody>
                                    {invoices.map((invoice: any) => {
                                        const isPaid = invoice.status === "PAID";
                                        const isOpen = invoice.status === "OPEN";
                                        const date = new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        const desc = invoice.items?.[0]?.description || invoice.type;

                                        return (
                                            <TableRow key={invoice.id} className="border-b border-border hover:bg-accent group transition-colors duration-150">
                                                <TableCell className="py-4 pl-5 font-mono text-xs font-bold text-muted-foreground w-28">
                                                    {date}
                                                </TableCell>
                                                <TableCell className="py-4 font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                    {desc}
                                                </TableCell>
                                                <TableCell className="py-4 font-mono text-sm font-black text-foreground text-right">
                                                    LKR {Number(invoice.totalAmount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="py-4 pr-5 text-right w-28">
                                                    <span className={cn(
                                                        "text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded border tracking-wide",
                                                        isPaid && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                        isOpen && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                        (!isPaid && !isOpen) && "bg-muted text-muted-foreground border-border"
                                                    )}>
                                                        {invoice.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {invoices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs italic">
                                                No financial records found for this client.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* =========================================
                    TAB: NOTES
                ========================================= */}
                <TabsContent value="notes" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 outline-none">
                    <Card className="p-6 bg-card border border-border rounded-2xl flex flex-col h-[500px]">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-3 mb-4">Trainer Private Notes</span>
                        <Textarea
                            placeholder="Document observations, technique tweaks, or medical concerns here. This is only visible to staff."
                            className="flex-1 bg-background border-border resize-none rounded-xl text-sm leading-relaxed mb-4 focus-visible:ring-primary/20"
                        />
                        <Button className="w-full text-xs font-bold h-10 rounded-xl">
                            Save Note to Profile
                        </Button>
                    </Card>

                    <Card className="p-6 bg-card border border-border rounded-2xl h-[500px] flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-3 mb-4">Note History</span>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-border">
                            {client.notesHistory?.length > 0 ? client.notesHistory.map((note: any) => (
                                <div key={note.id} className="p-4 bg-background border border-border rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">{note.date}</p>
                                        <p className="text-[10px] font-bold text-primary">{note.author}</p>
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground">{note.content}</p>
                                </div>
                            )) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-xs text-muted-foreground italic">No historical notes found.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Custom internal components for clean layout
function Metric({ label, value, mono = false, valueClass = "" }: { label: string, value: string | number, mono?: boolean, valueClass?: string }) {
    return (
        <div className="flex flex-col">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
            <p className={cn("text-xl font-black tracking-tight", mono && "font-mono", valueClass)}>{value}</p>
        </div>
    );
}

function Placeholder({ text, icon }: { text: string, icon?: React.ReactNode }) {
    return (
        <div className="p-10 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center gap-4 bg-muted/20">
            {icon}
            <p className="text-sm text-muted-foreground font-medium">{text}</p>
        </div>
    );
}