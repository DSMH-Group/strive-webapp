// app/tenants/[subdomain]/(admin)/member/payments/paymentsClient.tsx
"use client";

import React, { useState } from "react";
import Script from "next/script"; // 🚀 NEW: Import Next.js Script component
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Coins, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { striveClientFetch } from "@/lib/api";

// 🚀 NEW: Tell TypeScript about the global PayHere object injected by the script
declare global {
    interface Window {
        payhere: any;
    }
}

interface PaymentsClientProps {
    subdomain: string;
    tenantId: string;
}

export default function PaymentsClient({ subdomain, tenantId }: PaymentsClientProps) {
    const queryClient = useQueryClient();
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

    // 🚀 1. Fetch Core Member Data
    const { data: memberProfile, isLoading: isMemberLoading } = useQuery({
        queryKey: ["memberProfile", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members/me", { headers: { "X-Tenant-ID": tenantId } });
            if (!res.ok) throw new Error("Failed to fetch member profile");
            return res.json();
        },
        enabled: !!tenantId
    });

    // 🚀 2. Fetch Invoice Ledger
    const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
        queryKey: ["memberInvoices", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/billing/invoices", { headers: { "X-Tenant-ID": tenantId } });
            if (!res.ok) throw new Error("Failed to fetch invoices");
            return res.json();
        },
        enabled: !!tenantId
    });

    // 🚀 3. Fetch Available Plans
    const { data: availablePlans = [] } = useQuery({
        queryKey: ["tenantPlans", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/plans", { headers: { "X-Tenant-ID": tenantId } });
            if (!res.ok) throw new Error("Failed to fetch plans");
            return res.json();
        },
        enabled: !!tenantId
    });

    // 🚀 NEW: Centralized PayHere Checkout Handler
    const initiatePayHereCheckout = (serverPayload: any) => {
        if (typeof window === "undefined" || !window.payhere) {
            toast.error("Payment gateway failed to initialize. Please refresh the page.");
            return;
        }

        // Merge backend hash payload with dynamic frontend redirect URLs
        const payment = {
            ...serverPayload,
            return_url: `${window.location.origin}/member/payments`,
            cancel_url: `${window.location.origin}/member/payments`,
            notify_url: "https://strive-core-development.up.railway.app/api/v1/billing/webhook/payhere",
        };

        // Open the PayHere Modal
        window.payhere.startPayment(payment);

        // Listeners for modal events
        window.payhere.onCompleted = function onCompleted(orderId: string) {
            toast.info("Payment captured! Processing activation...", {
                description: "We are finalizing your membership ledger status."
            });

            // Give Railway backend 1.5 seconds to process the webhook before refetching
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["memberProfile", tenantId] });
                queryClient.invalidateQueries({ queryKey: ["memberInvoices", tenantId] });
            }, 1500);
        };

        window.payhere.onDismissed = function onDismissed() {
            toast.error("Payment modal closed. The transaction was cancelled.");
        };

        window.payhere.onError = function onError(error: string) {
            toast.error(`PayHere Gateway Error: ${error}`);
        };
    };

    // --- MUTATIONS ---

    // Cancel Subscription Auto-Renew
    const cancelSubMutation = useMutation({
        mutationFn: async () => {
            const res = await striveClientFetch("/api/v1/billing/subscriptions/me/cancel", {
                method: "PATCH",
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to cancel auto-renewal");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Auto-renewal disabled successfully.");
            queryClient.invalidateQueries({ queryKey: ["memberProfile", tenantId] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    // Pay Existing Invoice (Onboarding / Activation)
    const payInvoiceMutation = useMutation({
        mutationFn: async (invoiceId: string) => {
            const res = await striveClientFetch("/api/v1/billing/checkout/invoice", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId },
                body: JSON.stringify({ invoiceId })
            });
            if (!res.ok) throw new Error(await res.text() || "Payment failed");
            return res.json(); // Returns the generated PayHere payload
        },
        onSuccess: (data) => {
            initiatePayHereCheckout(data); // 🚀 Trigger Gateway Instead of Instant Success
        },
        onError: (err: any) => toast.error(`Payment initialization failed: ${err.message}`)
    });

    // Trigger Token Top Up Checkout
    const topUpMutation = useMutation({
        mutationFn: async (amount: number) => {
            const res = await striveClientFetch("/api/v1/billing/checkout/top-up", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId },
                body: JSON.stringify({ tokenAmount: amount })
            });
            if (!res.ok) throw new Error(await res.text() || "Checkout failed");
            return res.json();
        },
        onSuccess: (data) => {
            setIsTopUpOpen(false); // Close React Dialog
            initiatePayHereCheckout(data); // 🚀 Trigger Gateway
        },
        onError: (err: any) => toast.error(`Top-up initialization failed: ${err.message}`)
    });

    // Trigger Subscription Upgrade Checkout
    const subscribeMutation = useMutation({
        mutationFn: async (planId: string) => {
            const res = await striveClientFetch("/api/v1/billing/checkout/subscribe", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId },
                body: JSON.stringify({ planId })
            });
            if (!res.ok) throw new Error(await res.text() || "Checkout failed");
            return res.json();
        },
        onSuccess: (data) => {
            setIsUpgradeOpen(false); // Close React Dialog
            initiatePayHereCheckout(data); // 🚀 Trigger Gateway
        },
        onError: (err: any) => toast.error(`Upgrade initialization failed: ${err.message}`)
    });

    // --- RENDER ---

    if (isMemberLoading || isInvoicesLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-xs font-bold uppercase tracking-widest text-zinc-500 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Synchronizing Financial Ledger...
            </div>
        );
    }

    const activePlan = memberProfile?.activePlan;
    const isAutoRenew = memberProfile?.autoRenewEnabled;
    const expiresAt = memberProfile?.expiresAt ? new Date(memberProfile.expiresAt).toLocaleDateString() : "N/A";

    // Find any open invoice that needs paying
    const pendingInvoice = invoices.find((inv: any) => inv.status === "OPEN");

    return (
        <>
            {/* 🚀 NEW: Inject the PayHere SDK asynchronously */}
            <Script src="https://www.payhere.lk/lib/payhere.js" strategy="lazyOnload" />

            <div className="space-y-6 text-white select-none animate-in fade-in duration-500">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
                </div>

                {/* ACTION REQUIRED BANNER */}
                {pendingInvoice && (
                    <Card className="bg-amber-950/30 border border-amber-500/50 rounded-2xl p-6 shadow-lg shadow-amber-900/10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    Action Required: Pending Payment
                                </h3>
                                <p className="text-sm text-amber-200/70 mt-1">
                                    You have an unpaid invoice for LKR {Number(pendingInvoice.totalAmount).toLocaleString()}.
                                    {memberProfile?.status === "PENDING" ? " Pay this to activate your membership." : ""}
                                </p>
                            </div>
                            <Button
                                onClick={() => payInvoiceMutation.mutate(pendingInvoice.id)}
                                disabled={payInvoiceMutation.isPending}
                                className="bg-amber-500 hover:bg-amber-400 text-black font-bold whitespace-nowrap w-full sm:w-auto"
                            >
                                {payInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Pay LKR {Number(pendingInvoice.totalAmount).toLocaleString()}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Active Subscription Overview Card Container */}
                <Card className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                            <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono block">Active Subscription</span>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-lg font-black text-white tracking-tight">{activePlan?.name || "No Active Plan"}</h2>
                                {memberProfile?.status === "ACTIVE" && (
                                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 tracking-wide uppercase">Active</span>
                                )}
                                {memberProfile?.status === "PENDING" && (
                                    <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tracking-wide uppercase">Pending Activation</span>
                                )}
                            </div>
                            <div className="text-xs text-zinc-400 font-medium font-mono flex items-center gap-2">
                                {activePlan ? `LKR ${Number(activePlan.monthlyPrice).toLocaleString()}/mo` : "Pay-As-You-Go"}
                                {isAutoRenew ? ` · Renews ${expiresAt}` : ` · Expires ${expiresAt}`}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0">
                            {/* Token Top Up Modal */}
                            <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                                <DialogTrigger>
                                    <Button disabled={memberProfile?.status === "PENDING"} className="bg-zinc-950 hover:bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl h-10 px-4 flex-1 sm:flex-none gap-1.5 transition-colors">
                                        <Coins className="w-3.5 h-3.5" /> Top Up Tokens
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-950 border border-white/10 text-white sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Purchase Session Tokens</DialogTitle>
                                        <DialogDescription className="text-zinc-400 text-xs">
                                            Tokens allow you to book classes or facility access.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-3 py-4">
                                        <Button variant="outline" onClick={() => topUpMutation.mutate(5)} disabled={topUpMutation.isPending} className="h-16 border-white/10 hover:bg-white/5 flex flex-col gap-1">
                                            <span className="font-bold">5 Tokens</span>
                                        </Button>
                                        <Button variant="outline" onClick={() => topUpMutation.mutate(10)} disabled={topUpMutation.isPending} className="h-16 border-white/10 hover:bg-white/5 flex flex-col gap-1">
                                            <span className="font-bold">10 Tokens</span>
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Upgrade Plan Modal */}
                            <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                                <DialogTrigger>
                                    <Button variant="outline" disabled={memberProfile?.status === "PENDING"} className="bg-zinc-900 border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-xl h-10 px-4 flex-1 sm:flex-none transition-colors">
                                        Upgrade Plan
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-950 border border-white/10 text-white sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Available Membership Tiers</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-3 py-2">
                                        {availablePlans.map((plan: any) => (
                                            <div key={plan.id} className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-zinc-900/30">
                                                <div>
                                                    <h4 className="font-bold text-sm">{plan.name}</h4>
                                                    <p className="text-xs text-zinc-400 font-mono">LKR {Number(plan.monthlyPrice).toLocaleString()} · {plan.sessionTokens} Tokens</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => subscribeMutation.mutate(plan.id)}
                                                    disabled={subscribeMutation.isPending || activePlan?.id === plan.id}
                                                    className="text-xs font-bold bg-primary text-black hover:bg-primary/90"
                                                >
                                                    {activePlan?.id === plan.id ? "Current" : "Select"}
                                                </Button>
                                            </div>
                                        ))}
                                        {availablePlans.length === 0 && <p className="text-xs text-center text-zinc-500 py-4">No plans available.</p>}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {isAutoRenew && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelSubMutation.mutate()}
                                disabled={cancelSubMutation.isPending}
                                className="text-[10px] text-zinc-500 hover:text-red-400 uppercase tracking-widest font-bold"
                            >
                                Cancel Auto-Renew
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Isolated Tenant Payment History Table Grid */}
                <Card className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-6 space-y-4">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block border-b border-white/5 pb-2">Payment History</span>

                    <div className="border border-white/5 rounded-xl overflow-hidden bg-zinc-950/40">
                        <Table>
                            <TableBody>
                                {invoices.map((invoice: any) => {
                                    const isPaid = invoice.status === "PAID";
                                    const isOpen = invoice.status === "OPEN";
                                    const date = new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    const desc = invoice.items?.[0]?.description || invoice.type;

                                    return (
                                        <TableRow key={invoice.id} className="border-b border-white/5 hover:bg-zinc-900/40 group transition-colors duration-150">
                                            <TableCell className="py-4 pl-5 font-mono text-xs font-bold text-zinc-500 w-24">
                                                {date}
                                            </TableCell>
                                            <TableCell className="py-4 font-bold text-sm text-zinc-200 group-hover:text-primary transition-colors">
                                                {desc}
                                            </TableCell>
                                            <TableCell className="py-4 font-mono text-sm font-black text-white text-right">
                                                LKR {Number(invoice.totalAmount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="py-4 pr-5 text-right w-24">
                                                <span className={cn(
                                                    "text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded border tracking-wide",
                                                    isPaid && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                                    isOpen && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                    (!isPaid && !isOpen) && "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                                )}>
                                                    {invoice.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {invoices.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-zinc-500 text-xs italic">
                                            No transaction logs matched this facility scope parameter.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

            </div>
        </>
    );
}