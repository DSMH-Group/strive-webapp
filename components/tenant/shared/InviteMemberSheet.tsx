// components/tenant/shared/InviteMemberSheet.tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { striveClientFetch } from "@/lib/api";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface InviteMemberSheetProps {
    tenantId: string;
    children?: React.ReactNode;
}

export function InviteMemberSheet({ tenantId, children }: InviteMemberSheetProps) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    // --- State Management ---
    const [inviteName, setInviteName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePhone, setInvitePhone] = useState("");
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");

    // --- Fetch Available Plans ---
    const { data: availablePlans = [], isLoading: isLoadingPlans } = useQuery({
        queryKey: ["tenantPlans", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/plans", { headers: { "X-Tenant-ID": tenantId } });
            if (!res.ok) throw new Error("Failed to fetch plans");
            return res.json();
        },
        enabled: isOpen && !!tenantId // Only fetch when the sheet is open
    });

    const inviteMutation = useMutation({
        mutationFn: async (newInvite: { email?: string; phone?: string; initialRole: string; planId?: string }) => {
            const res = await striveClientFetch("/api/v1/members/invites", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId },
                body: JSON.stringify(newInvite)
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to dispatch invitation.");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Invitation dispatched successfully via SMS/Email!");
            queryClient.invalidateQueries({ queryKey: ["tenantMembersGrid", tenantId] });

            // Reset and close
            setInviteName("");
            setInviteEmail("");
            setInvitePhone("");
            setSelectedPlanId("");
            setIsOpen(false);
        },
        onError: (error: any) => {
            toast.error(`Invitation blocked: ${error.message}`);
        }
    });

    const handleSendInvite = (e: React.FormEvent) => {
        e.preventDefault();

        if (!inviteName.trim()) {
            toast.error("Please supply the member's full name.");
            return;
        }

        if (!inviteEmail && !invitePhone) {
            toast.error("Please supply either an Email address or a Phone number.");
            return;
        }

        let formattedPhone = "";

        // --- Strict Sri Lankan Phone Number Validation & Normalization ---
        if (invitePhone) {
            const cleanDigits = invitePhone.replace(/\D/g, "");
            const targetDigits = cleanDigits.startsWith("0") ? cleanDigits.slice(1) : cleanDigits;
            const lkPhoneRegex = /^(70|71|72|74|75|76|77|78|11|21|23|24|25|26|27|31|32|33|34|35|36|37|38|41|45|47|51|52|54|55|57|63|65|66|67|81|91)\d{7}$/;

            if (!lkPhoneRegex.test(targetDigits)) {
                toast.error("Invalid Sri Lankan mobile number format. Example: 0771234567");
                return;
            }

            // Ensures the '+' is included for the backend DTO validation
            formattedPhone = `+94${targetDigits}`;
        }

        inviteMutation.mutate({
            email: inviteEmail.trim() || undefined,
            phone: formattedPhone || undefined,
            initialRole: "MEMBER",
            planId: selectedPlanId || undefined
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger>
                {children ? children : (
                    <Button variant="outline" className="h-10 text-xs border-border bg-card text-foreground rounded-md font-bold gap-2 px-4 hover:bg-accent">
                        <UserPlus className="w-3.5 h-3.5 text-primary" /> Invite Member
                    </Button>
                )}
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md bg-background border-l border-border text-foreground overflow-y-auto">
                <SheetHeader className="pb-6 border-b border-border mb-6">
                    <SheetTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        Onboard Workspace Member
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground/80">
                        Send an authentication invite linking a user to this facility. You can optionally assign a plan to prompt payment upon activation.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSendInvite} className="px-1 flex flex-col h-[calc(100vh-180px)]">
                    <div className="space-y-6 flex-1">

                        {/* Member Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                            <Input
                                type="text"
                                placeholder="Nimal Perera"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                className="bg-card border-border text-sm h-10"
                                required
                            />
                        </div>

                        {/* Email Address */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                            <Input
                                type="email"
                                placeholder="nimal.perera@example.lk"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="bg-card border-border text-sm h-10"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                            <div className="relative flex items-center group">
                                <span className="absolute left-3 text-sm font-mono text-muted-foreground/70 select-none pointer-events-none transition-colors group-focus-within:text-foreground">
                                    +94
                                </span>
                                <Input
                                    type="text"
                                    placeholder="0771234567"
                                    value={invitePhone}
                                    onChange={(e) => setInvitePhone(e.target.value)}
                                    className="bg-card border-border text-sm h-10 font-mono pl-12"
                                />
                            </div>
                            <span className="text-[10px] text-muted-foreground/60 block px-1">
                                Accepts format with or without leading zero
                            </span>
                        </div>

                        {/* Plan Assignment Selection */}
                        <div className="space-y-1.5 pt-2 border-t border-border">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center justify-between">
                                Assign Activation Plan
                                {isLoadingPlans && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                            </label>
                            <select
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">No Plan (Self-Service / Free Trial)</option>
                                {availablePlans.map((plan: any) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - LKR {Number(plan.monthlyPrice).toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            <span className="text-[10px] text-muted-foreground/60 block px-1">
                                If selected, the user must pay for this plan to activate their account.
                            </span>
                        </div>
                    </div>

                    {/* Footer Execution Actions */}
                    <div className="pt-6 pb-2 flex items-center justify-end gap-2 shrink-0">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={inviteMutation.isPending} className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]">
                            {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invitation"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}