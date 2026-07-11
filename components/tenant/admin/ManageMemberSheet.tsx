// app/tenants/[subdomain]/(admin)/clients/ManageMemberSheet.tsx
"use client";

import React, {useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Coins, CreditCard, Loader2, Radio, ShieldAlert, X} from "lucide-react";
import {toast} from "sonner";
import {striveClientFetch} from "@/lib/api";

interface ManageMemberSheetProps {
    memberId: string | null;
    tenantId: string;
    onClose: () => void;
}

export function ManageMemberSheet({memberId, tenantId, onClose}: ManageMemberSheetProps) {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState("ACTIVE");
    const [activePlanId, setActivePlanId] = useState<string>("NONE");
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

    // --- Fetch Member Attendance Logs ---
    const {data: attendanceLogs = [], refetch: refetchAttendance} = useQuery<any[]>({
        queryKey: ["memberAttendanceLogs", memberId],
        queryFn: async () => {
            const res = await striveClientFetch(`/api/v1/attendances?membershipId=${memberId}`, {
                headers: {"X-Tenant-ID": tenantId}
            });
            return res.ok ? res.json() : [];
        },
        enabled: !!memberId
    });

    // --- Mutation: Force Checkout ---
    const forceCheckoutMutation = useMutation({
        mutationFn: async (attendanceId: string) => {
            const res = await striveClientFetch(`/api/v1/attendances/${attendanceId}`, {
                method: "PATCH",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ checkoutTime: new Date().toISOString() })
            });
            if (!res.ok) throw new Error("Force checkout failed.");
        },
        onSuccess: () => {
            toast.success("Member successfully checked out.");
            refetchAttendance();
            queryClient.invalidateQueries({ queryKey: ["consoleOperationalLedger", tenantId] });
        },
        onError: (err: any) => toast.error(`Checkout error: ${err.message}`)
    });

    useEffect(() => {
        if (memberData) {
            setStatus(memberData.status || "ACTIVE");
            setActivePlanId(memberData.activePlanId || "NONE");
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
                    activePlanId: activePlanId === "NONE" ? null : activePlanId,
                    tokensLeft: Number(tokensLeft),
                    rfidTag: rfidTag || null
                })
            });
            if (!res.ok) throw new Error("Re-verification handling rejection matrix triggered.");
        },
        onSuccess: () => {
            toast.success("Client system lifecycle overrides successfully mapped.");
            queryClient.invalidateQueries({ queryKey: ["tenantMembersGrid", tenantId] });
            onClose();
        },
        onError: (err: any) => toast.error(`Error updating membership: ${err.message}`)
    });

    // --- Mutation: Remit Ledger Record Manually ---
    const manualPaymentMutation = useMutation({
        mutationFn: async ({ invoiceId, amount }: { invoiceId: string, amount: number }) => {
            const res = await striveClientFetch("/api/v1/billing/payments/manual", {
                method: "POST",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    invoiceId,
                    method: "CASH",
                    amount // 🚀 Accurately pulling the totalAmount from the invoice object
                })
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Ledger database rejected structural manual reconciliation.");
            }
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
                        <h3 className="text-sm font-bold tracking-tight uppercase text-foreground">Client Control Center</h3>
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
                            <Select value={status} onValueChange={(val) => setStatus(val || "ACTIVE")}>
                                <SelectTrigger className="w-full h-10 bg-background border-border text-xs font-bold uppercase tracking-wider text-foreground">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    <SelectItem value="ACTIVE">Active (Ingress Cleared)</SelectItem>
                                    <SelectItem value="PENDING">Pending Handshake</SelectItem>
                                    <SelectItem value="GRACE_PERIOD">Grace Period Lock</SelectItem>
                                    <SelectItem value="SUSPENDED">Suspended (Banned Access)</SelectItem>
                                    <SelectItem value="CANCELLED">Terminated / Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Segment 2: Plan Catalog Linking Mapping */}
                        <div className="space-y-2.5 p-4 bg-card/40 border border-border rounded-lg">
                            <Label
                                className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-primary"/> Subscription Assignment
                            </Label>
                            <Select value={activePlanId} onValueChange={(val) => setActivePlanId(val || "NONE")}>
                                <SelectTrigger className="w-full h-10 bg-background border-border text-xs font-medium text-foreground">
                                    <SelectValue placeholder="No Active Plan (Manual Rollover)" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground max-h-60">
                                    <SelectItem value="NONE">No Active Plan (Manual Rollover)</SelectItem>
                                    {globalPlans.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} — LKR {Number(p.monthlyPrice).toLocaleString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                         className="flex flex-col gap-2 p-3 bg-background border border-border rounded-md">

                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs text-foreground truncate max-w-[200px]">
                                                    {invoice.items?.[0]?.description || invoice.type}
                                                </span>
                                                <span className="text-muted-foreground text-[10px] font-mono mt-0.5">
                                                    INV-{invoice.id.slice(0, 5).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-mono font-bold text-xs text-primary">
                                                LKR {Number(invoice.totalAmount).toLocaleString()}
                                            </span>
                                        </div>

                                        <Button
                                            size="sm"
                                            type="button"
                                            onClick={() => manualPaymentMutation.mutate({
                                                invoiceId: invoice.id,
                                                amount: Number(invoice.totalAmount)
                                            })}
                                            disabled={manualPaymentMutation.isPending}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs h-8 rounded shadow-sm"
                                        >
                                            Collect Cash & Mark Paid
                                        </Button>
                                    </div>
                                ))}
                                {invoices.filter((inv: any) => inv.status !== "PAID").length === 0 && (
                                    <p className="text-xs text-muted-foreground italic text-center py-4 bg-background/50 rounded-md border border-border/50">
                                        No outstanding balance markers matched on ledger.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Segment 5: Attendance Timeline & Check-ins */}
                        <div className="space-y-3 p-4 bg-card/40 border border-border rounded-lg">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                Attendance & Check-in Logs
                            </Label>
                            <div className="space-y-2">
                                {attendanceLogs.slice(0, 4).map((log: any) => {
                                    const isCheckedIn = !log.checkOutTime;
                                    return (
                                        <div key={log.id} className="flex flex-col gap-2 p-3 bg-background border border-border rounded-md">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs text-foreground">
                                                        Check-In Time
                                                    </span>
                                                    <span className="text-muted-foreground text-[10px] font-mono mt-0.5">
                                                        {new Date(log.checkInTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <span className="bg-background px-2 py-0.5 border border-border rounded text-[10px] font-mono text-muted-foreground">
                                                    {log.authMethod || "RFID"}
                                                </span>
                                            </div>
                                            
                                            {isCheckedIn ? (
                                                <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-between items-center">
                                                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-sans">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        Inside Facility
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        type="button"
                                                        onClick={() => forceCheckoutMutation.mutate(log.id)}
                                                        disabled={forceCheckoutMutation.isPending}
                                                        className="bg-destructive/10 hover:bg-destructive text-destructive hover:text-white font-sans font-bold text-[10px] uppercase h-7 px-3 rounded shadow-sm transition-all"
                                                    >
                                                        Force Checkout
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/40 flex justify-between font-mono">
                                                    <span>Checked Out:</span>
                                                    <span>
                                                        {new Date(log.checkOutTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {attendanceLogs.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic text-center py-4 bg-background/50 rounded-md border border-border/50">
                                        No recent facility check-in logs detected.
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {/* Footer Controls */}
                <div className="p-6 border-t border-border bg-card/50 flex justify-end gap-3 mt-auto shrink-0">
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