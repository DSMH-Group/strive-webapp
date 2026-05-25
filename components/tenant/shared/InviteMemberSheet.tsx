"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface InviteMemberSheetProps {
    tenantId: string;
    children?: React.ReactNode; // Add this
}

export function InviteMemberSheet({ tenantId, children }: InviteMemberSheetProps) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePhone, setInvitePhone] = useState("");
    const [inviteRole, setInviteRole] = useState<"MEMBER" | "TRAINER" | "MANAGER" | "ORG_ADMIN">("MEMBER");

    const inviteMutation = useMutation({
        mutationFn: async (newInvite: { email: string; phone: string; initialRole: string }) => {
            const res = await striveClientFetch("/api/v1/members/invites", {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId },
                body: JSON.stringify(newInvite)
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to dispatch invitation footprint.");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Invitation dispatched successfully via SMS/Email!");
            // Instruct the global cache to refresh the table behind the sheet
            queryClient.invalidateQueries({ queryKey: ["tenantMembersGrid", tenantId] });

            // Reset and close
            setInviteEmail("");
            setInvitePhone("");
            setInviteRole("MEMBER");
            setIsOpen(false);
        },
        onError: (error: any) => {
            toast.error(`Invitation blocked: ${error.message}`);
        }
    });

    const handleSendInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail && !invitePhone) {
            toast.error("Please supply either a target verification Email or Phone line.");
            return;
        }
        inviteMutation.mutate({
            email: inviteEmail || '',
            phone: invitePhone || '',
            initialRole: inviteRole
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger >
                {children ? children : (
                    <Button variant="outline" className="h-10 text-xs border-border bg-card text-foreground rounded-md font-bold gap-2 px-4 hover:bg-accent">
                        <UserPlus className="w-3.5 h-3.5 text-primary" /> Invite Member
                    </Button>
                )}
            </SheetTrigger>

            {/* We use w-[400px] or sm:w-[540px] to ensure it looks good on desktop,
                while inherently defaulting to 100% width on mobile screens.
            */}
            <SheetContent className="w-full sm:max-w-md bg-background border-l border-border text-foreground overflow-y-auto">
                <SheetHeader className="pb-6 border-b border-border mb-6">
                    <SheetTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        Onboard Workspace Identity
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground/80">
                        Send an edge authentication invite linking a user to this facility workspace domain. They will receive a localized SMS or Email.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSendInvite} className="space-y-6 px-6 flex flex-col h-[calc(100vh-180px)]">
                    <div className="space-y-4 flex-1">
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
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number (Sri Lankan Format)</label>
                            <Input
                                type="text"
                                placeholder="+94771234567"
                                value={invitePhone}
                                onChange={(e) => setInvitePhone(e.target.value)}
                                className="bg-card border-border text-sm h-10 font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Initial Workspace RBAC Tier</label>
                            <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                                <SelectTrigger className="bg-card border-border text-xs h-10">
                                    <SelectValue placeholder="Select Tier" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    <SelectItem value="MEMBER">MEMBER (Baseline Consumer)</SelectItem>
                                    <SelectItem value="TRAINER">TRAINER (Staff Fitness Resource)</SelectItem>
                                    <SelectItem value="MANAGER">MANAGER (Facility Supervisor)</SelectItem>
                                    <SelectItem value="ORG_ADMIN">ORG_ADMIN (Full System Operator)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Fixed to the bottom of the sidebar */}
                    <div className="pt-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
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