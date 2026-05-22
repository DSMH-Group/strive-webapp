// app/tenants/[subdomain]/(admin)/console/consoleClient.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Activity, ArrowUpRight, Settings, Plus, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner"; // Assuming you use Sonner for toasts

interface ConsoleClientProps {
    subdomain: string;
    tenantName: string;
    members: any[];
    invoices: any[];
    attendances: any;
}

export default function ConsoleClient({ subdomain, tenantName, members, invoices, attendances }: ConsoleClientProps) {
    // 1. Process Data
    const activeMembers = members.filter(m => m.status === 'ACTIVE').length;

    // Summing up invoice line items for quick revenue tracking
    const monthlyRevenue = invoices.reduce((acc: number, inv: any) => {
        return acc + (inv.lineItems?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0);
    }, 0);

    // Mock today's footfall from the history array (in a real app, filter by today's date)
    const todaysFootfall = attendances?.history?.length || 0;

    // 2. Interaction Handlers
    const handleBroadcastAction = () => {
        toast.info("Broadcast modal opened (Not implemented yet)");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Action Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                        Operator Workspace
                    </p>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        {tenantName}
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Link href={`/${subdomain}/settings`}>
                        <Button variant="outline" className="border-white/10 bg-zinc-900 rounded-xl hover:bg-zinc-800">
                            <Settings className="w-4 h-4 mr-2" /> Facility Settings
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Core Operator KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AdminStatCard
                    title="Active Subscriptions"
                    value={activeMembers.toString()}
                    trend="Live Member Count"
                    icon={<Users className="w-5 h-5 text-blue-500" />}
                />
                <AdminStatCard
                    title="Monthly Receivables"
                    value={`Rs. ${monthlyRevenue.toLocaleString()}`}
                    trend="Pending Settlements"
                    icon={<CreditCard className="w-5 h-5 text-emerald-500" />}
                />
                <AdminStatCard
                    title="Total Check-ins"
                    value={todaysFootfall.toString()}
                    trend="Recent Traffic"
                    icon={<Activity className="w-5 h-5 text-orange-500" />}
                />
            </div>

            {/* Main Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Member Directory Snapshot */}
                <Card className="bg-zinc-900/50 border-white/5 rounded-[2rem]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            Recent Signups
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                            Directory <ArrowUpRight className="w-3 h-3 ml-1"/>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {members.slice(0, 5).map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                                        {member.user?.firstName?.[0] || "U"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">{member.user?.firstName || "Unknown User"} {member.user?.lastName || ""}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase">{member.status}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-1 rounded-md border border-white/5">
                                    {member.rfidTag || "NO RFID"}
                                </span>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <p className="text-sm text-zinc-500 text-center py-6">No members linked yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Command Center (Quick Actions) */}
                <Card className="bg-zinc-900 border-white/5 rounded-[2rem] p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50"/>
                    <div className="relative space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black italic uppercase tracking-tight text-white">Command Center</h3>
                            <p className="text-sm text-zinc-400">Manage daily gym operations and POS.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickActionButton
                                label="Onboard Member"
                                icon={<Plus className="w-4 h-4"/>}
                                onClick={() => toast.info("Opening Onboarding Flow")}
                            />
                            <QuickActionButton
                                label="Log Cash Payment"
                                icon={<CreditCard className="w-4 h-4"/>}
                                onClick={() => toast.info("Opening POS Terminal")}
                            />
                            <QuickActionButton
                                label="Front Desk Mode"
                                icon={<MonitorPlay className="w-4 h-4"/>}
                                onClick={() => toast.success("Launching check-in kiosk")}
                            />
                            <QuickActionButton
                                label="Broadcast SMS"
                                icon={<Users className="w-4 h-4"/>}
                                onClick={handleBroadcastAction}
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Sub-components
function AdminStatCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
    return (
        <Card className="bg-zinc-900 border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
                {icon}
            </div>
            <div>
                <div className="text-3xl font-black text-white">{value}</div>
                <div className="text-xs text-zinc-500 mt-1">{trend}</div>
            </div>
        </Card>
    );
}

function QuickActionButton({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick?: () => void }) {
    return (
        <Button
            onClick={onClick}
            variant="outline"
            className="h-14 bg-zinc-950 border-white/5 hover:border-primary/50 hover:bg-white/5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all group"
        >
            <span className="text-muted-foreground group-hover:text-primary transition-colors">{icon}</span>
            <span className="text-[10px] uppercase font-bold tracking-tighter text-zinc-400 group-hover:text-white transition-colors">{label}</span>
        </Button>
    );
}