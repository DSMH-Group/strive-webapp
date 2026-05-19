"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Wallet,
    CreditCard,
    History,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Plus,
    Loader2,
    AlertCircle
} from "lucide-react";

interface InvoiceLineItem {
    description: string;
    amount: number;
}

interface StriveInvoice {
    id: string;
    membershipId: string;
    tenantName?: string; // Appended by gateway resolution or mapping
    type: "SUBSCRIPTION" | "TOKEN";
    status: "PAID" | "UNPAID" | "OVERDUE"; // Frontend mapped statuses
    amount: number;
    createdAt: string;
    lineItems: InvoiceLineItem[];
}

interface VaultedCard {
    id: string;
    brand: "visa" | "mastercard";
    last4: string;
    expiry: string;
    isDefault: boolean;
}

interface WalletDashboardClientProps {
    initialToken: string;
    globalUser: { id: string };
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// Kept client-side optimized to maintain zero-PCI footprint out of backend scope
const MOCK_VAULTED_CARDS: VaultedCard[] = [
    { id: "card-1", brand: "visa", last4: "4321", expiry: "09/29", isDefault: true },
    { id: "card-2", brand: "mastercard", last4: "8899", expiry: "12/27", isDefault: false }
];

export default function WalletDashboardClient({ initialToken, globalUser }: WalletDashboardClientProps) {
    const queryClient = useQueryClient();

    // 1. Fetch platform-wide unified invoice ledger
    const { data: invoices, isLoading, isError, error } = useQuery<StriveInvoice[]>({
        queryKey: ["invoices"],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/api/v1/billing/invoices`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${initialToken}`,
                    "Content-Type": "application/json",
                }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to parse platform-wide financial parameters.");
            }
            return res.json();
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    // 2. Direct Ledger Settlement Mutation via Web Fetch
    const settleInvoiceMutation = useMutation({
        mutationFn: async ({ invoiceId, amount }: { invoiceId: string; amount: number }) => {
            const res = await fetch(`${BASE_URL}/api/v1/billing/payments/manual`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${initialToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    invoiceId,
                    method: "BANK_TRANSFER",
                    amount: amount
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Financial handshake validation error.");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Payment Received Successfully!", {
                description: "Invoice status updated on live ledger trail.",
            });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
        onError: (err: Error) => {
            toast.error("Transaction Core Error", { description: err.message });
        }
    });

    // 3. Dynamic State Machine Transition (Using SUSPENDED as compliant Unsubscribe action)
    const toggleSubscriptionMutation = useMutation({
        mutationFn: async ({ membershipId, targetState }: { membershipId: string; targetState: "ACTIVE" | "SUSPENDED" }) => {
            const res = await fetch(`${BASE_URL}/api/v1/members/${membershipId}/transition`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${initialToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ targetState })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "State transition rejected by lifecycle constraints.");
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            const isActivating = variables.targetState === "ACTIVE";
            toast.success(isActivating ? "Subscription Reactivated!" : "Subscription Paused Safely", {
                description: `Environment status boundary updated to ${variables.targetState}.`,
            });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
        onError: (err: Error) => {
            toast.error("Lifecycle Bound Violation", { description: err.message });
        }
    });

    // Process structural metrics from runtime queries
    const overdueInvoices = invoices?.filter(i => i.status === "OVERDUE" || i.status === "UNPAID") || [];
    const absoluteTotalDue = overdueInvoices.reduce((sum, current) => sum + current.amount, 0);

    // Extract unique active tenant profiles from loaded invoice logs to handle actions cleanly
    const connectedMemberships = React.useMemo(() => {
        if (!invoices) return [];
        const seen = new Set<string>();
        return invoices.reduce((acc, current) => {
            if (!seen.has(current.membershipId)) {
                seen.add(current.membershipId);
                acc.push({
                    membershipId: current.membershipId,
                    tenantName: current.tenantName || "Partner Facility"
                });
            }
            return acc;
        }, [] as Array<{ membershipId: string; tenantName: string }>);
    }, [invoices]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Wallet size={12} /> Secure Billing Vault
                </p>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                    Financial Core
                </h1>
                <p className="text-sm text-zinc-400 max-w-xl">
                    Unified wallet oversight across all Strive-powered sports environments and fitness domains.
                </p>
            </div>

            {/* Critical Alert Warning Area for Outstanding Balances */}
            {absoluteTotalDue > 0 && (
                <div className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-red-950/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white uppercase tracking-tight text-sm">Action Gated System Alert</h3>
                            <p className="text-xs text-zinc-400">
                                You have {overdueInvoices.length} outstanding invoices totaling <span className="text-red-400 font-mono font-bold">LKR {absoluteTotalDue.toLocaleString()}</span>. Outstanding deficits trigger immediate automation lockout rules.
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => settleInvoiceMutation.mutate({
                            invoiceId: overdueInvoices[0].id,
                            amount: overdueInvoices[0].amount
                        })}
                        disabled={settleInvoiceMutation.isPending}
                        className="bg-red-500 hover:bg-red-600 font-bold text-white rounded-xl text-xs uppercase tracking-tight h-10 px-5 shrink-0"
                    >
                        {settleInvoiceMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                        Clear Immediate Deficit
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Columns - Billing Records Matrix */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-lg font-bold uppercase italic tracking-tight flex items-center gap-2">
                            <History size={16} className="text-primary" /> Invoice Ledger history
                        </h2>
                        <Badge variant="outline" className="border-white/5 bg-zinc-900 text-zinc-500 text-[10px] uppercase font-mono">
                            Live Synchronization
                        </Badge>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-12 gap-2 text-zinc-500 text-xs uppercase tracking-widest font-bold">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Processing Ledger Statements...
                        </div>
                    )}

                    {isError && (
                        <div className="rounded-[2rem] border border-red-500/10 bg-red-500/5 p-6 text-center space-y-2">
                            <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                            <p className="text-xs text-zinc-400">{(error as Error).message}</p>
                        </div>
                    )}

                    {!isLoading && !isError && invoices && (
                        <div className="space-y-3">
                            {invoices.map((invoice) => (
                                <Card key={invoice.id} className="bg-zinc-900 border-white/5 rounded-2xl overflow-hidden group">
                                    <CardContent className="p-5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black italic tracking-tighter ${
                                                invoice.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                            }`}>
                                                {invoice.status === "PAID" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-white group-hover:text-primary transition-colors">
                                                        {invoice.lineItems[0]?.description || "Cycle Statement Settlement"}
                                                    </h4>
                                                    <span className="text-[10px] text-zinc-500">•</span>
                                                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold italic">
                                                        {invoice.tenantName || "Strive Space"}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500 font-mono">
                                                    {new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ID: {invoice.id.substring(0, 8).toUpperCase()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right space-y-1.5">
                                            <div className="text-sm font-black font-mono tracking-tighter text-white">
                                                LKR {invoice.amount.toLocaleString()}
                                            </div>
                                            {invoice.status !== "PAID" ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => settleInvoiceMutation.mutate({ invoiceId: invoice.id, amount: invoice.amount })}
                                                    disabled={settleInvoiceMutation.isPending}
                                                    className="h-6 text-[10px] px-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary hover:text-black rounded-lg uppercase tracking-tighter font-bold"
                                                >
                                                    {settleInvoiceMutation.isPending && settleInvoiceMutation.variables?.invoiceId === invoice.id ? (
                                                        <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" />
                                                    ) : null}
                                                    Pay Now
                                                </Button>
                                            ) : (
                                                <Badge variant="outline" className="border-emerald-500/10 bg-emerald-500/5 text-emerald-400 font-mono text-[9px]">
                                                    Settled
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column - Card Vault & Multi-Tenant Actions */}
                <div className="space-y-6">
                    {/* Vault Card Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-lg font-bold uppercase italic tracking-tight flex items-center gap-2">
                                <CreditCard size={16} className="text-primary" /> Tokenized Vault
                            </h2>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white rounded-lg">
                                <Plus size={14} />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {MOCK_VAULTED_CARDS.map((card) => (
                                <div key={card.id} className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/5 rounded-2xl p-5 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 rounded-lg bg-zinc-950 border border-white/10 flex items-center justify-center text-[10px] uppercase font-black italic tracking-widest text-zinc-400">
                                            {card.brand}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">•••• •••• •••• {card.last4}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono">EXPIRES {card.expiry}</p>
                                        </div>
                                    </div>
                                    {card.isDefault ? (
                                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[9px] uppercase tracking-tight font-black">
                                            Primary
                                        </Badge>
                                    ) : (
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-zinc-500 hover:text-white uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            Use Primary
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Operational Lifecycle Controller */}
                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2rem] overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-white tracking-tight flex items-center gap-2">
                                    <RefreshCw size={14} className="text-orange-500" /> Subscription Actions
                                </h3>
                                <p className="text-[11px] text-zinc-500 mt-0.5">Quickly suspend or reactivate workspace gate authorization scopes.</p>
                            </div>

                            <div className="space-y-2 pt-2">
                                {connectedMemberships.length > 0 ? (
                                    connectedMemberships.map((membership) => (
                                        <div key={membership.membershipId} className="flex items-center justify-between text-xs border-b border-white/5 last:border-none pb-2 last:pb-0 pt-1">
                                            <span className="font-medium text-zinc-300">{membership.tenantName}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleSubscriptionMutation.mutate({
                                                        membershipId: membership.membershipId,
                                                        targetState: "SUSPENDED"
                                                    })}
                                                    disabled={toggleSubscriptionMutation.isPending}
                                                    className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase tracking-tighter disabled:opacity-50"
                                                >
                                                    Pause
                                                </button>
                                                <span className="text-zinc-700">|</span>
                                                <button
                                                    onClick={() => toggleSubscriptionMutation.mutate({
                                                        membershipId: membership.membershipId,
                                                        targetState: "ACTIVE"
                                                    })}
                                                    disabled={toggleSubscriptionMutation.isPending}
                                                    className="text-primary hover:text-primary/80 font-bold text-[10px] uppercase tracking-tighter disabled:opacity-50"
                                                >
                                                    Activate
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-zinc-600 italic py-2 text-center">No active environments linked.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}