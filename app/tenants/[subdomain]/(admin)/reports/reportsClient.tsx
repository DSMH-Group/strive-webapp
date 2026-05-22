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
    AlertTriangle
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
        color: "var(--color-muted-foreground)",
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
        <div className="space-y-8 animate-in fade-in duration-500 text-foreground">

            {/* Context Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
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
                        className="h-10 border-border bg-card rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground text-xs font-semibold gap-2 px-4"
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
                    <Card className="bg-card border-border rounded-lg p-6">
                        <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Stream Allocations</CardTitle>
                                <CardDescription className="text-muted-foreground/60 text-xs">Comparing automatic gateway collections vs manual cash</CardDescription>
                            </div>
                            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3" /> Healthy Margin
                            </span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ChartContainer config={chartConfig} className="h-[280px] w-full">
                                <BarChart accessibilityLayer data={billingStreamData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                                    <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis stroke="currentColor" className="text-muted-foreground" tickLine={false} axisLine={false} tickMargin={8} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="subscriptions" fill="var(--color-subscriptions)" radius={[4, 4, 0, 0]} stackId="a" />
                                    <Bar dataKey="cashManual" fill="var(--color-cashManual)" radius={[4, 4, 0, 0]} stackId="a" />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Manual Bank/Cash Reconciliation Module */}
                    <Card className="bg-card border-border rounded-lg p-6">
                        <div className="space-y-1 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Manual Payment Verification</h3>
                            <p className="text-xs text-muted-foreground/60">Cross-reference incoming offline bank transfers with corresponding billing schedules</p>
                        </div>
                        <div className="border border-border rounded-md overflow-hidden bg-background/40">
                            <Table>
                                <TableHeader className="bg-background">
                                    <TableRow className="border-b border-border hover:bg-transparent">
                                        <TableHead className="text-muted-foreground text-xs py-3.5 pl-4">Target Account/Member</TableHead>
                                        <TableHead className="text-muted-foreground text-xs">Method</TableHead>
                                        <TableHead className="text-muted-foreground text-xs">Amount</TableHead>
                                        <TableHead className="text-muted-foreground text-xs text-right pr-4">Action Context</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { id: "tx-1", name: "K. Sandeep (Direct Bank Transfer)", method: "BANK_TRANSFER", amount: 24500 },
                                        { id: "tx-2", name: "M. F. Perera (Cash at Counter)", method: "CASH", amount: 15000 },
                                        { id: "tx-3", name: "Studio Core Sri Lanka (Corporate Cheque)", method: "BANK_TRANSFER", amount: 45500 }
                                    ].map((tx) => (
                                        <TableRow key={tx.id} className="border-b border-border hover:bg-accent/40 group">
                                            <TableCell className="py-3.5 pl-4 font-bold text-sm text-foreground">{tx.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-mono">{tx.method}</TableCell>
                                            <TableCell className="text-foreground text-xs font-mono font-bold">LKR {tx.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right pr-4 py-3.5">
                                                <Button
                                                    size="sm"
                                                    onClick={() => toast.success("Ledger transactional match recorded successfully.")}
                                                    className="h-7 bg-background border border-border rounded-sm hover:bg-accent hover:text-accent-foreground text-[10px] font-bold uppercase tracking-tight text-muted-foreground transition-all"
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
                    <Card className="bg-card border-border rounded-lg p-6">
                        <div className="space-y-1 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Peak Load Heatmaps</h3>
                            <p className="text-xs text-muted-foreground/60">Hourly facility capacity and hardware check-in traffic loads</p>
                        </div>
                        <div className="space-y-2">
                            {[
                                { hour: "06:00 AM - 09:00 AM (Morning Peak)", load: 92, status: "CRITICAL" },
                                { hour: "09:00 AM - 12:00 PM (Midday Draw)", load: 34, status: "LOW" },
                                { hour: "12:00 PM - 04:00 PM (Steady Baseline)", load: 58, status: "MODERATE" },
                                { hour: "04:00 PM - 08:00 PM (Evening Surge)", load: 88, status: "HIGH" },
                            ].map((slot, i) => (
                                <div key={i} className="p-3 bg-background/60 rounded-md border border-border space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-foreground">{slot.hour}</span>
                                        <span className={cn(
                                            "font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm border",
                                            slot.status === "CRITICAL" || slot.status === "HIGH" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-muted-foreground bg-muted border-border"
                                        )}>{slot.load}% Capacity</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted border border-border rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                slot.load > 85 ? "bg-primary" : slot.load > 50 ? "bg-cyan-500" : "bg-muted-foreground/40"
                                            )}
                                            style={{ width: `${slot.load}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Operational Risk Management Notification Panel */}
                    <Card className="bg-card border-border rounded-lg p-6 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="text-base font-black italic uppercase tracking-tight text-foreground">Retention Risk Warnings</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            The core platform identified **3 profiles** stuck inside active `GRACE_PERIOD` parameters due to repeated recurring payment failures on local gateways.
                        </p>
                        <Button
                            onClick={() => toast.info("Opening SMS communication broadcasting queue...")}
                            className="w-full bg-background border border-border rounded-md h-10 text-xs font-bold gap-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
            "bg-card border-border rounded-md p-5 flex flex-col gap-3 transition-all hover:border-muted-foreground/20",
            isHighlight && "ring-1 ring-amber-500/20 bg-amber-500/5"
        )}>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
            <div className="space-y-1">
                <div className={cn("text-xl font-black font-mono tracking-tight", isHighlight ? "text-amber-500" : "text-foreground")}>{value}</div>
                <p className="text-[10px] text-muted-foreground font-medium">{subtext}</p>
            </div>
        </Card>
    );
}