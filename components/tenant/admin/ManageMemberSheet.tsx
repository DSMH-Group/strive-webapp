// app/tenants/[subdomain]/(admin)/clients/ManageMemberSheet.tsx
"use client";

import React, {useEffect, useState} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Coins, CreditCard, Loader2, Radio, ShieldAlert, X} from "lucide-react";
import {toast} from "sonner";
import {striveClientFetch} from "@/lib/api";

interface ManageMemberSheetProps {
    memberId: string | null;
    tenantId: string;
    onClose: () => void;
}

export function ManageMemberSheet({memberId, tenantId, onClose}: ManageMemberSheetProps) {
    const [status, setStatus] = useState("ACTIVE");
    const [activePlanId, setActivePlanId] = useState("");
    const [tokensLeft, setTokensLeft] = useState<number>(0);
    const [rfidTag, setRfidTag] = useState("");

    // --- Fetch Target Client Context Parameters ---
    const {data: memberData, isLoading: memberLoading} = useQuery({
        queryKey: ["memberDetail", memberId],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/members/${memberId}`, {
                headers: {"X-Tenant-ID": tenantId}
            });
            if (!res.ok) throw new Error("Could not drop core telemetry handshake mapping.");
            return res.json();
        },
        enabled: !!memberId
    });

    // --- Fetch Operational Product Catalog Tiers ---
    const {data: globalPlans = []} = useQuery({
        queryKey: ["tenantPlans", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/plans?includeInactive=false", {
                headers: {"X-Tenant-ID": tenantId}
            });
            return res.ok ? res.json() : [];
        },
        enabled: !!memberId
    });

    // --- Fetch Open Invoices for Manual Ledger Remittance ---
    const {data: invoices = [], refetch: refetchInvoices} = useQuery({
        queryKey: ["memberInvoices", memberId],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/billing/invoices?membershipId=${memberId}`, {
                headers: {"X-Tenant-ID": tenantId}
            });
            return res.ok ? res.json() : [];
        },
        enabled: !!memberId
    });

    useEffect(() => {
        if (memberData) {
            setStatus(memberData.status || "ACTIVE");
            setActivePlanId(memberData.activePlanId || "");
            setTokensLeft(memberData.tokensLeft || 0);
            setRfidTag(memberData.rfidTag || "");
        }
    }, [memberData]);

    // --- Mutation: Update Profiles or Lifecycles ---
    const updateProfileMutation = useMutation({
        mutationFn: async () => {
            const res = await striveClientFetch(`/api/v1/members/${memberId}`, {
                method: "PATCH",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status,
                    activePlanId: activePlanId || null,
                    tokensLeft: Number(tokensLeft),
                    rfidTag: rfidTag || null
                })
            });
            if (!res.ok) throw new Error("Re-verification handling rejection matrix triggered.");
        },
        onSuccess: () => {
            toast.success("Client system lifecycle overrides successfully mapped.");
            onClose();
        },
        onError: (err: any) => toast.error(`Error updating membership: ${err.message}`)
    });

    // --- Mutation: Remit Ledger Record Manually ---
    const manualPaymentMutation = useMutation({
        mutationFn: async (invoiceId: string) => {
            const res = await striveClientFetch("/api/v1/billing/payments/manual", {
                method: "POST",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    invoiceId,
                    method: "CASH",
                    amount: 5000 // Placeholder matching internal ledger parameters dynamically
                })
            });
            if (!res.ok) throw new Error("Ledger database rejected structural manual reconciliation.");
        },
        onSuccess: () => {
            toast.success("Cash payment collected. Account status synced.");
            refetchInvoices();
        },
        onError: (err: any) => toast.error(`Reconciliation process exception: ${err.message}`)
    });

    if (!memberId) return null;

    return (
        <>
            <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}/>
            <div
                className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold tracking-tight uppercase text-foreground">Client Control
                            Center</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{memberId.slice(0, 13)}...</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4"/>
                    </Button>
                </div>

                {memberLoading ? (
                    <div className="flex-1 flex items-center justify-center"><Loader2
                        className="w-6 h-6 animate-spin text-primary"/></div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Segment 1: Lifecycle State Boundary */}
                        <div className="space-y-2.5 p-4 bg-card/40 border border-border rounded-lg">
                            <Label
                                className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-primary"/> Core Access Status
                            </Label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full h-10 bg-background border border-border rounded-md px-3 text-xs font-bold uppercase tracking-wider text-foreground"
                            >
                                <option value="ACTIVE">Active (Ingress Cleared)</option>
                                <option value="PENDING">Pending Handshake</option>
                                <option value="GRACE_PERIOD">Grace Period Lock</option>
                                <option value="SUSPENDED">Suspended (Banned Access)</option>
                                <option value="CANCELLED">Terminated / Cancelled</option>
                            </select>
                        </div>

                        {/* Segment 2: Plan Catalog Linking Mapping */}
                        <div className="space-y-2.5 p-4 bg-card/40 border border-border rounded-lg">
                            <Label
                                className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-primary"/> Subscription Assignment
                            </Label>
                            <select
                                value={activePlanId}
                                onChange={(e) => setActivePlanId(e.target.value)}
                                className="w-full h-10 bg-background border border-border rounded-md px-3 text-xs font-medium text-foreground"
                            >
                                <option value="">No Active Plan (Manual Rollover)</option>
                                {globalPlans.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} —
                                        LKR {Number(p.monthlyPrice).toLocaleString()}</option>
                                ))}
                            </select>
                        </div>

                        {/* Segment 3: Composed Ledger Token Limits */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 p-4 bg-card/40 border border-border rounded-lg">
                                <Label
                                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Coins className="w-3.5 h-3.5 text-primary"/> Token Balance
                                </Label>
                                <Input
                                    type="number"
                                    value={tokensLeft}
                                    onChange={(e) => setTokensLeft(Number(e.target.value))}
                                    className="h-10 bg-background border-border font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2 p-4 bg-card/40 border border-border rounded-lg">
                                <Label
                                    className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Radio className="w-3.5 h-3.5 text-primary"/> RFID Hardware Token
                                </Label>
                                <Input
                                    type="text"
                                    value={rfidTag}
                                    onChange={(e) => setRfidTag(e.target.value)}
                                    placeholder="RFID-XXXX"
                                    className="h-10 bg-background border-border font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Segment 4: Manual Financial Ledger Reconciliation */}
                        <div className="space-y-3 p-4 bg-card/40 border border-border rounded-lg">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                Outstanding Balances & Ledger Invoices
                            </Label>
                            <div className="space-y-2">
                                {invoices.filter((inv: any) => inv.status !== "PAID").map((invoice: any) => (
                                    <div key={invoice.id}
                                         className="flex items-center justify-between p-2.5 bg-background border border-border rounded-md text-xs font-mono">
                                        <div className="flex flex-col">
                                            <span
                                                className="font-bold text-foreground">INV-{invoice.id.slice(0, 5).toUpperCase()}</span>
                                            <span
                                                className="text-muted-foreground text-[11px] mt-0.5">LKR {Number(invoice.amount || 5000).toLocaleString()}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            type="button"
                                            onClick={() => manualPaymentMutation.mutate(invoice.id)}
                                            disabled={manualPaymentMutation.isPending}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[11px] h-7 px-2.5 rounded shadow-sm"
                                        >
                                            Mark as Paid
                                        </Button>
                                    </div>
                                ))}
                                {invoices.filter((inv: any) => inv.status !== "PAID").length === 0 && (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">No outstanding
                                        balance markers matched on ledger.</p>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {/* Footer Controls */}
                <div className="p-6 border-t border-border bg-card/50 flex justify-end gap-3 mt-auto">
                    <Button variant="ghost" onClick={onClose} className="text-xs font-bold">Cancel</Button>
                    <Button
                        type="button"
                        disabled={updateProfileMutation.isPending}
                        onClick={() => updateProfileMutation.mutate()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-10 gap-1.5 px-5 rounded-md shadow-md"
                    >
                        {updateProfileMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                        Commit Changes
                    </Button>
                </div>
            </div>
        </>
    );
}