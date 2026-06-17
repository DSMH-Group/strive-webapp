// app/tenants/[subdomain]/(admin)/member/payments/paymentsClient.tsx
"use client";

import React, { useState } from "react";
import Script from "next/script";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
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
import { Coins, Loader2, AlertCircle, CreditCard, Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { striveClientFetch } from "@/lib/api";

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
    const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);

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

    // 🚀 4. Fetch Saved Cards (Tokenized)
    const { data: savedCards = [], isLoading: isCardsLoading } = useQuery({
        queryKey: ["memberCards", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/billing/cards", { headers: { "X-Tenant-ID": tenantId } });
            if (!res.ok) throw new Error("Failed to fetch saved cards");
            return res.json();
        },
        enabled: !!tenantId
    });

    const defaultCard = savedCards.find((card: any) => card.isDefault) || savedCards[0];

    // --- PAYHERE HANDLERS ---

    // Handler for Standard Manual Checkout
    const initiatePayHereCheckout = (serverPayload: any) => {
        if (typeof window === "undefined" || !window.payhere) {
            toast.error("Payment gateway failed to initialize. Please refresh the page.");
            return;
        }

        const payment = {
            ...serverPayload,
            // 🚀 DEV HACK: Force PayHere to validate against 'localhost' instead of 'test.localhost'
            return_url: `${window.location.origin}/member/payments`,
            cancel_url: `${window.location.origin}/member/payments`,
            notify_url: "https://strive-core-development.up.railway.app/api/v1/billing/webhook/payhere",
        };

        window.payhere.startPayment(payment);

        window.payhere.onCompleted = function onCompleted() {
            toast.info("Payment captured! Processing activation...", {
                description: "We are finalizing your membership ledger status."
            });
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["memberProfile", tenantId] });
                queryClient.invalidateQueries({ queryKey: ["memberInvoices", tenantId] });
            }, 1500);
        };

        window.payhere.onDismissed = () => toast.error("Payment modal closed. The transaction was cancelled.");
        window.payhere.onError = (error: string) => toast.error(`PayHere Gateway Error: ${error}`);
    };

    // Handler for Card Preapproval (Tokenization)
    const initiateCardSave = (serverPayload: any) => {
        if (typeof window === "undefined" || !window.payhere) {
            toast.error("Payment gateway failed to initialize. Please refresh the page.");
            return;
        }

        const preapprovalPayload = {
            ...serverPayload,
            preapprove: true,
            // 🚀 DEV HACK: Force PayHere to validate against 'localhost'
            return_url: `${window.location.origin}/member/payments`,
            cancel_url: `${window.location.origin}/member/payments`,
            notify_url: "https://strive-core-development.up.railway.app/api/v1/billing/webhook/payhere-preapproval",
        };

        window.payhere.startPayment(preapprovalPayload);

        window.payhere.onCompleted = function onCompleted() {
            toast.success("Card securely saved!", {
                description: "Future transactions will be processed with 1-click."
            });
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["memberCards", tenantId] });
            }, 1500);
        };

        window.payhere.onDismissed = () => toast.error("Card setup was cancelled.");
        window.payhere.onError = (error: string) => toast.error(`PayHere Preapproval Error: ${error}`);
    };

    // --- MUTATIONS ---

    // 1. Add New Card Mutation
    const addCardMutation = useMutation({
        mutationFn: async () => {
            const res = await striveClientFetch("/api/v1/billing/cards/setup", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to initialize card setup");
            return res.json();
        },
        onSuccess: (data) => initiateCardSave(data),
        onError: (err: any) => toast.error(`Card setup initialization failed: ${err.message}`)
    });

    // 2. Remove Card Mutation
    const removeCardMutation = useMutation({
        mutationFn: async (cardId: string) => {
            const res = await striveClientFetch(`/api/v1/billing/cards/${cardId}`, {
                method: "DELETE",
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to remove card");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Card removed successfully.");
            queryClient.invalidateQueries({ queryKey: ["memberCards", tenantId] });
        },
        onError: (err: any) => toast.error(`Failed to remove card: ${err.message}`)
    });

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

    // Modified to pass cardId for 1-click payment
    const handleCheckoutSuccess = (data: any, closeModals: () => void) => {
        closeModals();
        if (data.charged) {
            // Backend already charged the saved token successfully
            toast.success("Payment successful via saved card!");
            queryClient.invalidateQueries({ queryKey: ["memberProfile", tenantId] });
            queryClient.invalidateQueries({ queryKey: ["memberInvoices", tenantId] });
        } else {
            // Backend returned PayHere payload for manual checkout
            initiatePayHereCheckout(data);
        }
    };

    const payInvoiceMutation = useMutation({
        mutationFn: async (invoiceId: string) => {
            const res = await striveClientFetch("/api/v1/billing/checkout/invoice", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId },
                body: JSON.stringify({ invoiceId, cardId: defaultCard?.id })
            });
            if (!res.ok) throw new Error(await res.text() || "Payment failed");
            return res.json();
        },
        onSuccess: (data) => handleCheckoutSuccess(data, () => {}),
        onError: (err: any) => toast.error(`Payment initialization failed: ${err.message}`)
    });

    const topUpMutation = useMutation({
        mutationFn: async (amount: number) => {
            const res = await striveClientFetch("/api/v1/billing/checkout/top-up", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId },
                body: JSON.stringify({ tokenAmount: amount, cardId: defaultCard?.id })
            });
            if (!res.ok) throw new Error(await res.text() || "Checkout failed");
            return res.json();
        },
        onSuccess: (data) => handleCheckoutSuccess(data, () => setIsTopUpOpen(false)),
        onError: (err: any) => toast.error(`Top-up initialization failed: ${err.message}`)
    });

    const subscribeMutation = useMutation({
        mutationFn: async (planId: string) => {
            const res = await striveClientFetch("/api/v1/billing/checkout/subscribe", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId },
                body: JSON.stringify({ planId, cardId: defaultCard?.id })
            });
            if (!res.ok) throw new Error(await res.text() || "Checkout failed");
            return res.json();
        },
        onSuccess: (data) => handleCheckoutSuccess(data, () => setIsUpgradeOpen(false)),
        onError: (err: any) => toast.error(`Checkout initialization failed: ${err.message}`)
    });

    if (isMemberLoading || isInvoicesLoading || isCardsLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-xs font-bold uppercase tracking-widest text-muted-foreground gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Synchronizing Financial Ledger...
            </div>
        );
    }

    const activePlan = memberProfile?.activePlan;
    const isAutoRenew = memberProfile?.autoRenewEnabled;
    const expiresAt = memberProfile?.expiresAt ? new Date(memberProfile.expiresAt).toLocaleDateString() : "N/A";
    const pendingInvoice = invoices.find((inv: any) => inv.status === "OPEN");

    return (
        <>
            {/* 🚀 THE FIX: Restored the Universal PayHere script */}
            <Script src="https://www.payhere.lk/lib/payhere.js" strategy="lazyOnload" />

            <div className="space-y-6 text-foreground select-none animate-in fade-in duration-500">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
                </div>

                {/* ACTION REQUIRED BANNER */}
                {pendingInvoice && (
                    <Card className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    Action Required: Pending Payment
                                </h3>
                                <p className="text-sm text-amber-600 mt-1">
                                    You have an unpaid invoice for LKR {Number(pendingInvoice.totalAmount).toLocaleString()}.
                                    {memberProfile?.status === "PENDING" ? " Pay this to activate your membership." : ""}
                                </p>
                            </div>
                            <Button
                                onClick={() => payInvoiceMutation.mutate(pendingInvoice.id)}
                                disabled={payInvoiceMutation.isPending}
                                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold whitespace-nowrap w-full sm:w-auto"
                            >
                                {payInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Pay {defaultCard ? `with •••• ${defaultCard.mask.slice(-4)}` : `LKR ${Number(pendingInvoice.totalAmount).toLocaleString()}`}
                            </Button>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Active Subscription Overview */}
                    <Card className="bg-card border border-border rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest font-mono block">Active Subscription</span>
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-lg font-black text-foreground tracking-tight">{activePlan?.name || "No Active Plan"}</h2>
                                        {memberProfile?.status === "ACTIVE" && (
                                            <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 tracking-wide uppercase">Active</span>
                                        )}
                                        {memberProfile?.status === "PENDING" && (
                                            <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tracking-wide uppercase">Pending Activation</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium font-mono flex items-center gap-2">
                                        {activePlan ? `LKR ${Number(activePlan.monthlyPrice).toLocaleString()}/mo` : "Pay-As-You-Go"}
                                        {activePlan && (isAutoRenew ? ` · Renews ${expiresAt}` : ` · Expires ${expiresAt}`)}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0">
                                    {/* Upgrade Plan Modal */}
                                    <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                                        <DialogTrigger>
                                            <Button variant="ghost" disabled={memberProfile?.status === "PENDING"} className="bg-muted border border-border hover:bg-accent text-foreground text-xs font-bold rounded-xl h-9 px-4 transition-colors w-full sm:w-auto">
                                                Upgrade Plan
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-card border border-border text-foreground sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Available Membership Tiers</DialogTitle>
                                            </DialogHeader>
                                            <div className="flex flex-col gap-3 py-2">
                                                {availablePlans.map((plan: any) => (
                                                    <div key={plan.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
                                                        <div>
                                                            <h4 className="font-bold text-sm">{plan.name}</h4>
                                                            <p className="text-xs text-muted-foreground font-mono">LKR {Number(plan.monthlyPrice).toLocaleString()} · {plan.sessionTokens} Tokens</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => subscribeMutation.mutate(plan.id)}
                                                            disabled={subscribeMutation.isPending}
                                                            className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                                                        >
                                                            {activePlan?.id === plan.id ? "Current (Renew)" : (defaultCard ? "1-Click Pay" : "Select")}
                                                        </Button>
                                                    </div>
                                                ))}
                                                {availablePlans.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">No plans available.</p>}
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Renew Current Plan */}
                                    {activePlan && memberProfile?.status !== "PENDING" && (
                                        <Button
                                            onClick={() => subscribeMutation.mutate(activePlan.id)}
                                            disabled={subscribeMutation.isPending}
                                            variant="outline"
                                            className="border-border hover:bg-accent text-foreground text-xs font-bold rounded-xl h-9 px-4 gap-1.5 transition-colors w-full sm:w-auto"
                                        >
                                            {subscribeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />}
                                            {defaultCard ? `Renew w/ •••• ${defaultCard.mask.slice(-4)}` : "Renew Plan"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 gap-4">
                            <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                                <DialogTrigger>
                                    <Button disabled={memberProfile?.status === "PENDING"} variant="outline" className="border-border hover:bg-accent text-primary text-xs font-bold rounded-xl h-10 px-4 gap-1.5 w-full sm:w-auto">
                                        <Coins className="w-3.5 h-3.5" /> Top Up Session Tokens
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border border-border text-foreground sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Purchase Session Tokens</DialogTitle>
                                        <DialogDescription className="text-muted-foreground text-xs">
                                            {defaultCard ? `Payments will be securely charged to your saved card ending in ${defaultCard.mask.slice(-4)}.` : "Tokens allow you to book classes or facility access."}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-3 py-4">
                                        <Button variant="outline" onClick={() => topUpMutation.mutate(5)} disabled={topUpMutation.isPending} className="h-16 border-border hover:bg-accent flex flex-col gap-1">
                                            <span className="font-bold">5 Tokens</span>
                                        </Button>
                                        <Button variant="outline" onClick={() => topUpMutation.mutate(10)} disabled={topUpMutation.isPending} className="h-16 border-border hover:bg-accent flex flex-col gap-1">
                                            <span className="font-bold">10 Tokens</span>
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {isAutoRenew && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => cancelSubMutation.mutate()}
                                    disabled={cancelSubMutation.isPending}
                                    className="text-[10px] text-muted-foreground hover:text-destructive uppercase tracking-widest font-bold"
                                >
                                    Cancel Auto-Renew
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Saved Payment Methods Card */}
                    <Card className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Payment Methods</span>
                            <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
                        </div>

                        <div className="flex-1 space-y-3">
                            {savedCards.map((card: any) => (
                                <div key={card.id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-background group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted p-2 rounded-lg">
                                            <CreditCard className="w-4 h-4 text-foreground" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold tracking-tight">{card.brand || "Card"}</span>
                                            <span className="text-xs text-muted-foreground font-mono">•••• {card.mask?.slice(-4) || "****"}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeCardMutation.mutate(card.id)}
                                        disabled={removeCardMutation.isPending}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}

                            {savedCards.length === 0 && (
                                <div className="text-center py-6 text-muted-foreground text-xs italic">
                                    No payment methods saved. Add one for 1-click checkouts and auto-renewals.
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={() => addCardMutation.mutate()}
                            disabled={addCardMutation.isPending}
                            variant="secondary"
                            className="w-full text-xs font-bold h-10 bg-muted hover:bg-accent transition-colors gap-2"
                        >
                            {addCardMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Add New Card
                        </Button>
                    </Card>
                </div>

                {/* Isolated Tenant Payment History Table Grid */}
                <Card className="bg-card border border-border rounded-[1.5rem] p-6 space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border pb-2">Payment History</span>

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
                                            <TableCell className="py-4 pl-5 font-mono text-xs font-bold text-muted-foreground w-24">
                                                {date}
                                            </TableCell>
                                            <TableCell className="py-4 font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {desc}
                                            </TableCell>
                                            <TableCell className="py-4 font-mono text-sm font-black text-foreground text-right">
                                                LKR {Number(invoice.totalAmount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="py-4 pr-5 text-right w-24">
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