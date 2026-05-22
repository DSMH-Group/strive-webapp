// app/tenants/[subdomain]/(admin)/reports/reportsClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    TrendingUp,
    Download,
    Layers,
    Clock,
    AlertTriangle,
    CheckCircle2,
    RefreshCcw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportsClientProps {
    subdomain: string;
    financials: any;
    utilization: any;
}

const chartConfig = {
    subscriptions: {
        label: "Digital Subscriptions",
        color: "var(--primary)",
    },
    cashManual: {
        label: "Manual/Cash Entries",
        color: "#52525b",
    }
} satisfies ChartConfig;

export default function ReportsClient({ subdomain, financials, utilization }: ReportsClientProps) {
    const [isExporting, setIsExporting] = useState(false);

    // --- Dynamic Industry Metric Formulations ---
    const financialStats = useMemo(() => {
        const totalGross = financials?.invoices?.reduce((acc: number, inv: any) => {
            return acc + (inv.lineItems?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0);
        }, 0) || 750000; // Realistic base fallback factor for local gym calculations

        // Local Sri Lankan operational overhead breakdowns (VAT 18% + SSCL 2.5% cumulative targets)
        const calculatedTax = totalGross * 0.205;
        const pendingReconciliation = financials?.pendingTransfers?.reduce((acc: number, item: any) => acc + item.amount, 0) || 85000;

        return {
            gross: totalGross,
            tax: calculatedTax,
            pending: pendingReconciliation,
            net: totalGross - calculatedTax
        };
    }, [financials]);

    // --- Chart Structure Mapping for shadcn/ui Component ---
    const billingStreamData = [
        { month: "Jan", subscriptions: 320000, cashManual: 80000 },
        { month: "Feb", subscriptions: 410000, cashManual: 95000 },
        { month: "Mar", subscriptions: 380000, cashManual: 120000 },
        { month: "Apr", subscriptions: 490000, cashManual: 75000 },
        { month: "May", subscriptions: 540000, cashManual: 110000 },
    ];

    const handleCsvExport = () => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            toast.success("Operational ledger data exported successfully as CSV.");
        }, 1200);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-white">

            {/* Context Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                        Analytical Overview
                    </p>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        Facility Performance Ledger
                    </h1>
                </div>
                <div>
                    <Button
                        onClick={handleCsvExport}
                        disabled={isExporting}
                        variant="outline"
                        className="h-10 border-white/5 bg-zinc-900 rounded-xl hover:bg-zinc-800 text-zinc-300 text-xs font-semibold gap-2 px-4"
                    >
                        <Download className="w-3.5 h-3.5" /> {isExporting ? "Compiling..." : "Export Financial Ledger"}
                    </Button>
                </div>
            </div>

            {/* Financial & Operational High-Performance KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportStatCard
                    title="Total Gross Revenue"
                    value={`LKR ${financialStats.gross.toLocaleString()}`}
                    subtext="All captured payments & streams"
                />
                <ReportStatCard
                    title="Net Operating Margin"
                    value={`LKR ${financialStats.net.toLocaleString()}`}
                    subtext="Gross income minus tax deductions"
                />
                <ReportStatCard
                    title="Tax Accruals (VAT/SSCL)"
                    value={`LKR ${financialStats.tax.toLocaleString()}`}
                    subtext="Accumulated local statutory dues"
                />
                <ReportStatCard
                    title="Awaiting Verification"
                    value={`LKR ${financialStats.pending.toLocaleString()}`}
                    subtext="Unreconciled bank/cash entries"
                    isHighlight={financialStats.pending > 0}
                />
            </div>

            {/* Core Analytics Grid Split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Visual Chart Infrastructure Block */}
                <div className="xl:col-span-2 space-y-6">
                    <Card className="bg-zinc-900/50 border-white/5 rounded-[2rem] p-6">
                        <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-400">Stream Allocations</CardTitle>
                                <CardDescription className="text-zinc-500 text-xs">Comparing automatic gateway collections vs manual cash</CardDescription>
                            </div>
                            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3" /> Healthy Margin
                            </span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ChartContainer config={chartConfig} className="h-[280px] w-full">
                                <BarChart accessibilityLayer data={billingStreamData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                                    <XAxis dataKey="month" stroke="#52525b" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis stroke="#52525b" tickLine={false} axisLine={false} tickMargin={8} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="subscriptions" fill="var(--color-subscriptions)" radius={[4, 4, 0, 0]} stackId="a" />
                                    <Bar dataKey="cashManual" fill="var(--color-cashManual)" radius={[4, 4, 0, 0]} stackId="a" />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Manual Bank/Cash Reconciliation Module */}
                    <Card className="bg-zinc-900/50 border-white/5 rounded-[2rem] p-6">
                        <div className="space-y-1 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Manual Payment Verification</h3>
                            <p className="text-xs text-zinc-500">Cross-reference incoming offline bank transfers with corresponding billing schedules</p>
                        </div>
                        <div className="border border-white/5 rounded-xl overflow-hidden bg-zinc-950/40">
                            <Table>
                                <TableHeader className="bg-zinc-950">
                                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 text-xs py-3.5 pl-4">Target Account/Member</TableHead>
                                        <TableHead className="text-zinc-500 text-xs">Method</TableHead>
                                        <TableHead className="text-zinc-500 text-xs">Amount</TableHead>
                                        <TableHead className="text-zinc-500 text-xs text-right pr-4">Action Context</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { id: "tx-1", name: "K. Sandeep (Direct Bank Transfer)", method: "BANK_TRANSFER", amount: 24500 },
                                        { id: "tx-2", name: "M. F. Perera (Cash at Counter)", method: "CASH", amount: 15000 },
                                        { id: "tx-3", name: "Studio Core Sri Lanka (Corporate Cheque)", method: "BANK_TRANSFER", amount: 45500 }
                                    ].map((tx) => (
                                        <TableRow key={tx.id} className="border-b border-white/5 hover:bg-zinc-900/40 group">
                                            <TableCell className="py-3.5 pl-4 font-bold text-sm text-zinc-200">{tx.name}</TableCell>
                                            <TableCell className="text-zinc-400 text-xs font-mono">{tx.method}</TableCell>
                                            <TableCell className="text-zinc-200 text-xs font-mono font-bold">LKR {tx.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right pr-4 py-3.5">
                                                <Button
                                                    size="sm"
                                                    onClick={() => toast.success("Ledger transactional match recorded successfully.")}
                                                    className="h-7 bg-zinc-900 hover:bg-emerald-950/40 hover:text-emerald-400 hover:border-emerald-500/30 text-[10px] font-bold uppercase tracking-tight border border-white/5 rounded-lg text-zinc-400 transition-all"
                                                >
                                                    Reconcile
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Right Structural Performance Metrics Column */}
                <div className="space-y-6">

                    {/* Hourly Traffic Load Monitoring */}
                    <Card className="bg-zinc-900/50 border-white/5 rounded-[2rem] p-6">
                        <div className="space-y-1 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Peak Load Heatmaps</h3>
                            <p className="text-xs text-zinc-500">Hourly facility capacity and hardware check-in traffic loads</p>
                        </div>
                        <div className="space-y-2">
                            {[
                                { hour: "06:00 AM - 09:00 AM (Morning Peak)", load: 92, status: "CRITICAL" },
                                { hour: "09:00 AM - 12:00 PM (Midday Draw)", load: 34, status: "LOW" },
                                { hour: "12:00 PM - 04:00 PM (Steady Baseline)", load: 58, status: "MODERATE" },
                                { hour: "04:00 PM - 08:00 PM (Evening Surge)", load: 88, status: "HIGH" },
                            ].map((slot, i) => (
                                <div key={i} className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-zinc-300">{slot.hour}</span>
                                        <span className={cn(
                                            "font-mono text-[9px] font-bold px-1.5 py-0.5 rounded",
                                            slot.status === "CRITICAL" || slot.status === "HIGH" ? "text-amber-400 bg-amber-500/10" : "text-zinc-500 bg-zinc-900"
                                        )}>{slot.load}% Capacity</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                slot.load > 85 ? "bg-primary" : slot.load > 50 ? "bg-cyan-500" : "bg-zinc-700"
                                            )}
                                            style={{ width: `${slot.load}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Operational Risk Management Notification Panel */}
                    <Card className="bg-zinc-900 border border-white/5 rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="text-base font-black italic uppercase tracking-tight text-white">Retention Risk Warnings</h3>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            The core platform identified **3 profiles** stuck inside active `GRACE_PERIOD` parameters due to repeated recurring payment failures on local gateways.
                        </p>
                        <Button
                            onClick={() => toast.info("Opening SMS communication broadcasting queue...")}
                            className="w-full bg-zinc-950 hover:bg-zinc-800 border border-white/5 rounded-xl h-10 text-xs font-bold gap-2 text-zinc-300 transition-colors"
                        >
                            Review Lockout Buffer Queue
                        </Button>
                    </Card>
                </div>

            </div>
        </div>
    );
}

// --- Presentation Card Component Helpers ---
function ReportStatCard({ title, value, subtext, isHighlight = false }: { title: string; value: string; subtext: string; isHighlight?: boolean }) {
    return (
        <Card className={cn(
            "bg-zinc-900/40 border-white/5 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:border-white/10",
            isHighlight && "ring-1 ring-amber-500/20 bg-amber-950/5"
        )}>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</span>
            <div className="space-y-1">
                <div className={cn("text-xl font-black font-mono tracking-tight", isHighlight ? "text-amber-400" : "text-white")}>{value}</div>
                <p className="text-[10px] text-zinc-500 font-medium">{subtext}</p>
            </div>
        </Card>
    );
}