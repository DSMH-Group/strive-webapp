// components/tenant/admin/settings/TeamMembers.tsx
"use client";

import React, {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Loader2, Mail, Phone, Plus, UserCheck, UserX, X} from "lucide-react";
import {toast} from "sonner";
import {striveClientFetch} from "@/lib/api";
import {SectionHeader} from "@/app/tenants/[subdomain]/(admin)/settings/settingsClient";
import {cn} from "@/lib/utils";

interface TeamMembersProps {
    tenantId: string;
    onComplete: () => void;
}

interface InviteFormData {
    email: string;
    phone: string;
    initialRole: "ORG_ADMIN" | "MANAGER" | "TRAINER";
}

export function TeamMembers({tenantId, onComplete}: TeamMembersProps) {
    const queryClient = useQueryClient();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [formData, setFormData] = useState<InviteFormData>({
        email: "",
        phone: "",
        initialRole: "TRAINER"
    });

    // --- 🚀 FIX: Fetch Current Authenticated Identity Profile to prevent Self-Modification ---
    const {data: currentUserProfile} = useQuery({
        queryKey: ["sidebarProfileHandshake", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/users/me", {method: "GET"});
            if (!res.ok) throw new Error("Failed to fetch current user context.");
            return res.json();
        }
    });

    // --- Fetch Operations Staff/Admin profiles ---
    const {data: staffMembers = [], isLoading} = useQuery({
        queryKey: ["tenantStaff", tenantId],
        queryFn: async () => {
            const rolesToFetch = ["ORG_ADMIN", "MANAGER", "TRAINER"];
            const requests = rolesToFetch.map(role =>
                striveClientFetch(`/api/v1/members?role=${role}`, {
                    headers: {"X-Tenant-ID": tenantId}
                }).then(res => (res.ok ? res.json() : []))
            );

            const results = await Promise.all(requests);
            const flattened = results.flat();

            const uniqueMap = new Map();
            flattened.forEach((m: any) => uniqueMap.set(m.id, m));
            return Array.from(uniqueMap.values());
        }
    });

    // --- Dispatch New Onboarding Invite Packet ---
    const inviteMutation = useMutation({
        mutationFn: async (payload: InviteFormData) => {
            const res = await striveClientFetch("/api/v1/members/invites", {
                method: "POST",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: payload.email,
                    phone: payload.phone,
                    initialRole: payload.initialRole
                })
            });
            if (!res.ok) throw new Error("Could not dispatch onboarding payload package.");
            return res.status === 204 ? {} : res.json();
        },
        onSuccess: () => {
            toast.success("System onboarding invitation successfully dispatched via Text.lk & Resend gateways.");
            queryClient.invalidateQueries({queryKey: ["tenantStaff", tenantId]});
            setIsInviteOpen(false);
            setFormData({email: "", phone: "", initialRole: "TRAINER"});
        },
        onError: (err: any) => toast.error(`Invitation routing error: ${err.message}`)
    });

    // --- Modify Operating Account Row ---
    const updateMembershipMutation = useMutation({
        mutationFn: async ({memberId, status, initialRole}: {
            memberId: string;
            status?: string;
            initialRole?: string
        }) => {
            const res = await striveClientFetch(`/api/v1/members/${memberId}`, {
                method: "PATCH",
                headers: {
                    "X-Tenant-ID": tenantId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...(status && {status}),
                    ...(initialRole && {initialRole}) // Adaptable to payload configuration demands
                })
            });
            if (!res.ok) throw new Error("Failed verification check mapping against core member modifiers.");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Account runtime mapping configuration updated.");
            queryClient.invalidateQueries({queryKey: ["tenantStaff", tenantId]});
        },
        onError: (err: any) => toast.error(`Account modification exception: ${err.message}`)
    });

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.phone) {
            toast.error("Contact routing channels must be populated to deliver onboarding data.");
            return;
        }
        inviteMutation.mutate(formData);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                <SectionHeader title="Team Members"
                               desc="Manage active permissions, role allocations, and workspace scope bindings for administrators and training staff"/>
                <Button
                    onClick={() => setIsInviteOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-md h-9 gap-1.5 px-4 shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5"/> Invite Staff
                </Button>
            </div>

            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-card/50 border-b border-border">
                            <TableRow className="border-b-0 hover:bg-transparent">
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider pl-4">OPERATOR
                                    IDENTITY</TableHead>
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider">SYSTEM
                                    CONFIG BOUNDARY ROLE</TableHead>
                                <TableHead
                                    className="text-xs text-muted-foreground font-bold tracking-wider">STATUS</TableHead>
                                <TableHead
                                    className="text-xs text-muted-foreground font-bold tracking-wider text-right pr-4">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffMembers.map((person: any) => {
                                const primaryRoleObj = person.roles?.find((r: any) => ["ORG_ADMIN", "MANAGER", "TRAINER"].includes(r.role));
                                const currentRole = primaryRoleObj?.role || "TRAINER";
                                const isActive = person.status === "ACTIVE";

                                // 🚀 SAFEGUARD CHECK: Is this row the current operator?
                                const isSelf = currentUserProfile?.id && person.userId === currentUserProfile.id;

                                return (
                                    <TableRow key={person.id}
                                              className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-xs font-bold text-muted-foreground border border-border shadow-sm uppercase relative">
                                                    {person.user?.firstName?.[0] || person.user?.email?.[0] || "U"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span
                                                        className="font-bold text-sm text-foreground flex items-center gap-2">
                                                        {person.user ? `${person.user.firstName} ${person.user.lastName}` : "Pending Linkage"}
                                                        {isSelf && (
                                                            <span
                                                                className="text-[10px] bg-primary/10 border border-primary/20 font-mono text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                You
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono mt-0.5">
                                                        {person.user?.email || person.email} · {person.user?.phone || person.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <select
                                                value={currentRole}
                                                disabled={isSelf || updateMembershipMutation.isPending}
                                                onChange={(e) => {
                                                    updateMembershipMutation.mutate({
                                                        memberId: person.id,
                                                        initialRole: e.target.value
                                                    });
                                                }}
                                                className="bg-background border border-border rounded px-2 py-1 text-xs font-mono font-bold uppercase tracking-wide text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <option value="ORG_ADMIN">Admin</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="TRAINER">Trainer</option>
                                            </select>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border tracking-wider",
                                                isActive
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            )}>
                                                {person.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isSelf || updateMembershipMutation.isPending}
                                                onClick={() => {
                                                    const targetState = isActive ? "SUSPENDED" : "ACTIVE";
                                                    updateMembershipMutation.mutate({
                                                        memberId: person.id,
                                                        status: targetState
                                                    });
                                                }}
                                                className={cn(
                                                    "h-8 text-xs font-bold px-3 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed",
                                                    isActive
                                                        ? "border-destructive/20 hover:bg-destructive/10 text-destructive"
                                                        : "border-primary/20 hover:bg-primary/10 text-primary"
                                                )}
                                            >
                                                {isActive ? <UserX className="w-3.5 h-3.5 mr-1"/> :
                                                    <UserCheck className="w-3.5 h-3.5 mr-1"/>}
                                                {isActive ? "Suspend Access" : "Reactivate"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {staffMembers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                                        No authorization structures mapped out for administrative workspace staff.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* --- Slide-Over Onboarding Panel Drawer UI --- */}
            {isInviteOpen && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity"
                     onClick={() => setIsInviteOpen(false)}/>
            )}

            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
                isInviteOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
                    <h3 className="text-sm font-bold tracking-tight uppercase text-foreground">Invite Operational
                        Staff</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsInviteOpen(false)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4"/>
                    </Button>
                </div>

                <form onSubmit={handleInviteSubmit} className="flex-1 flex flex-col">
                    <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">System
                                Role Boundary Alignment</Label>
                            <select
                                value={formData.initialRole}
                                onChange={(e) => setFormData({...formData, initialRole: e.target.value as any})}
                                className="w-full h-11 bg-card border border-border rounded-md px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="TRAINER">Trainer / Coach Profile</option>
                                <option value="MANAGER">Operational Facility Manager</option>
                                <option value="ORG_ADMIN">Global Enterprise Administrator</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Delivery
                                Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground/60"/>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="bg-card border-border h-11 pl-10 text-sm font-mono rounded-md"
                                    placeholder="name@fitforge.lk"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SMS
                                Route Target (+94 Format Required)</Label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground/60"/>
                                <Input
                                    type="tel"
                                    value={formData.phone}
                                    pattern="^\+94\d{9}$"
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="bg-card border-border h-11 pl-10 text-sm font-mono rounded-md"
                                    placeholder="+94771234567"
                                    required
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground/80 leading-normal">
                                Automated identity sync configuration uses localized parameters linking directly to
                                Text.lk gateway aggregators.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-border bg-card/50 flex justify-end gap-3 mt-auto">
                        <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}
                                className="text-xs font-bold">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={inviteMutation.isPending}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-10 gap-1.5 px-5 rounded-md shadow-md"
                        >
                            {inviteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                            Dispatch Invite
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}