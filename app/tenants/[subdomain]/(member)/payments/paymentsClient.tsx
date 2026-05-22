// app/tenants/[subdomain]/(admin)/member/payments/paymentsClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    CreditCard,
    Layers,
    Coins,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PaymentsClientProps {
    subdomain: string;
    tenantName: string;
    initialTenantInvoices: any[];
}

export default function PaymentsClient({ subdomain, tenantName, initialTenantInvoices = [] }: PaymentsClientProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    // --- High-Fidelity Data Local Hydration Map (Matching Uploaded Mockup State) ---
    const localizedInvoices = useMemo(() => {
        if (initialTenantInvoices.length > 0) return initialTenantInvoices;

        return [
            { id: "inv-01", date: "Mar 15", desc: "Standard 3-Month Renewal", amount: 37500, status: "PAID" },
            { id: "inv-02", date: "Mar 12", desc: "Token Pack × 10", amount: 5000, status: "PAID" },
            { id: "inv-03", date: "Dec 14", desc: "Standard 3-Month Renewal", amount: 37500, status: "PAID" },
        ];
    }, [initialTenantInvoices]);

    const activeSubscriptionMeta = {
        name: "Standard — 3 Months",
        renewalText: "Renews Jun 15, 2025 · LKR 12,500/mo",
        status: "ACTIVE"
    };

    const handleTokenTopUp = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            toast.success("Token Top-Up Succeeded!", {
                description: "10 consumable session blocks appended via local gateway transaction parameters.",
            });
        }, 1000);
    };

    return (
        <div className="space-y-6 text-white select-none animate-in fade-in duration-500">

            {/* Header Core Section */}
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            </div>

            {/* Active Subscription Overview Card Container */}
            <Card className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                        <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono block">Active Subscription</span>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-black text-white tracking-tight">{activeSubscriptionMeta.name}</h2>
                            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 tracking-wide uppercase">Active</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium font-mono">{activeSubscriptionMeta.renewalText}</p>
                    </div>

                    {/* Action Controls Grouping Row */}
                    <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0">
                        <Button
                            onClick={handleTokenTopUp}
                            disabled={isProcessing}
                            className="bg-zinc-950 hover:bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl h-10 px-4 flex-1 sm:flex-none gap-1.5 transition-colors"
                        >
                            <Coins className="w-3.5 h-3.5" /> Top Up Tokens
                        </Button>
                        <Button
                            onClick={() => toast.info("Opening membership tier selector engine...")}
                            variant="outline"
                            className="bg-zinc-900 border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-xl h-10 px-4 flex-1 sm:flex-none transition-colors"
                        >
                            Upgrade Plan
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Isolated Tenant Payment History Table Grid */}
            <Card className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-6 space-y-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block border-b border-white/5 pb-2">Payment History</span>

                <div className="border border-white/5 rounded-xl overflow-hidden bg-zinc-950/40">
                    <Table>
                        <TableBody>
                            {localizedInvoices.map((invoice) => {
                                const isPaid = invoice.status === "PAID";
                                return (
                                    <TableRow
                                        key={invoice.id}
                                        className="border-b border-white/5 hover:bg-zinc-900/40 group transition-colors duration-150"
                                    >
                                        {/* Date Stamp Column */}
                                        <TableCell className="py-4 pl-5 font-mono text-xs font-bold text-zinc-500 w-20">
                                            {invoice.date}
                                        </TableCell>

                                        {/* Settlement Row Description */}
                                        <TableCell className="py-4 font-bold text-sm text-zinc-200 group-hover:text-primary transition-colors">
                                            {invoice.desc}
                                        </TableCell>

                                        {/* Dynamic Localized Amount Value */}
                                        <TableCell className="py-4 font-mono text-sm font-black text-white text-right">
                                            LKR {invoice.amount.toLocaleString()}
                                        </TableCell>

                                        {/* Action Core Ledger Status Badge */}
                                        <TableCell className="py-4 pr-5 text-right w-24">
                                            <span className={cn(
                                                "text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded border tracking-wide",
                                                isPaid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            )}>
                                                {invoice.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {localizedInvoices.length === 0 && (
                                <TableRow>
                                    <TableCell className="text-center py-10 text-zinc-500 text-xs italic">
                                        No transaction logs matched this facility scope parameter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

        </div>
    );
}