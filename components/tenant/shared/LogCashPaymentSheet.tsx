// components/tenant/shared/LogCashPaymentSheet.tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { striveClientFetch } from "@/lib/api";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface LogCashPaymentSheetProps {
    tenantId: string;
    members: any[];
    children?: React.ReactNode;
}

export function LogCashPaymentSheet({ tenantId, members, children }: LogCashPaymentSheetProps) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    // Form states
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentToward, setPaymentToward] = useState<"SUBSCRIPTION" | "TOKEN">("SUBSCRIPTION");
    const [customReason, setCustomReason] = useState("");

    const logPaymentMutation = useMutation({
        mutationFn: async (payload: { membershipId: string; amount: number; type: "SUBSCRIPTION" | "TOKEN"; description: string }) => {
            // Step 1: Create Invoice
            const invoiceRes = await striveClientFetch("/api/v1/billing/invoices", {
                method: "POST",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    membershipId: payload.membershipId,
                    type: payload.type,
                    lineItems: [
                        {
                            description: payload.description,
                            amount: payload.amount
                        }
                    ]
                })
            });

            if (!invoiceRes.ok) {
                const errText = await invoiceRes.text();
                throw new Error(errText || "Failed to generate cash payment invoice.");
            }

            const invoice = await invoiceRes.json();

            // Step 2: Pay/Reconcile via cash
            const paymentRes = await striveClientFetch("/api/v1/billing/payments/manual", {
                method: "POST",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    method: "CASH",
                    amount: payload.amount
                })
            });

            if (!paymentRes.ok) {
                const errText = await paymentRes.text();
                throw new Error(errText || "Failed to reconcile cash receipt ledger.");
            }

            return paymentRes.json();
        },
        onSuccess: () => {
            toast.success("Cash payment logged & reconciled successfully.");
            queryClient.invalidateQueries({ queryKey: ["consoleOperationalLedger", tenantId] });
            setSelectedMemberId("");
            setAmount("");
            setCustomReason("");
            setIsOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to log cash payment.");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId) {
            toast.error("Please select a member.");
            return;
        }
        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }
        if (!customReason.trim()) {
            toast.error("Please provide a reason / payment note.");
            return;
        }

        logPaymentMutation.mutate({
            membershipId: selectedMemberId,
            amount: parsedAmount,
            type: paymentToward,
            description: customReason.trim()
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger>
                {children}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md bg-card border-l border-border p-6 flex flex-col justify-between">
                <div className="space-y-6">
                    <SheetHeader className="space-y-1.5 text-left">
                        <SheetTitle className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" /> Log Cash Payment
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                            Record a manual physical cash payment directly into the tenant billing ledger.
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} id="log-cash-payment-form" className="space-y-4 pt-4 border-t border-border">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Member</label>
                            <select
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                className="w-full bg-background border border-border h-10 px-3 rounded-xl text-sm font-semibold text-foreground focus-visible:outline-primary focus:ring-primary/20"
                                required
                            >
                                <option value="" disabled>-- Choose Member --</option>
                                {members.map((m: any) => (
                                    <option key={m.id} value={m.id}>
                                        {m.user?.firstName} {m.user?.lastName} ({m.user?.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Toward</label>
                            <select
                                value={paymentToward}
                                onChange={(e) => setPaymentToward(e.target.value as any)}
                                className="w-full bg-background border border-border h-10 px-3 rounded-xl text-sm font-semibold text-foreground focus-visible:outline-primary focus:ring-primary/20"
                                required
                            >
                                <option value="SUBSCRIPTION">Membership Subscription</option>
                                <option value="TOKEN">Token Top Up</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (LKR)</label>
                            <Input
                                type="number"
                                placeholder="e.g. 5000"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-background border-border h-10 text-sm rounded-xl font-mono font-bold"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Notes / Description</label>
                            <Textarea
                                placeholder="e.g. Monthly Standard Membership Fee, Personal Training Top Up"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                className="bg-background border-border text-sm rounded-xl min-h-[90px] resize-none"
                                required
                            />
                        </div>
                    </form>
                </div>

                <div className="pt-6 border-t border-border flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 text-xs font-bold h-10 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="log-cash-payment-form"
                        disabled={logPaymentMutation.isPending}
                        className="flex-1 text-xs font-bold h-10 rounded-xl"
                    >
                        {logPaymentMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...
                            </>
                        ) : (
                            "Log Payment"
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
