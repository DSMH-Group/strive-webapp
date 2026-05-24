"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Mail,
    Phone,
    Send,
    Trash2,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { striveClientFetch } from "@/lib/api";

interface InvitesClientProps {
    subdomain: string;
    tenantId: string;
}

export default function InvitesClient({ subdomain, tenantId }: InvitesClientProps) {
    const queryClient = useQueryClient();

    // 1. Fetch pending invitations
    const { data: invites = [], isLoading, isError } = useQuery<any[]>({
        queryKey: ["tenantPendingInvites", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members/invites", {
                method: "GET",
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Could not load current invitations ledger.");
            return res.json();
        },
        enabled: !!tenantId
    });

    // 2. Mutation to RESEND invite notification
    const resendMutation = useMutation({
        mutationFn: async (inviteId: string) => {
            const res = await striveClientFetch(`/api/v1/members/invites/${inviteId}/resend`, {
                method: "POST",
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to dispatch updated dispatch message.");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Invitation reminder dispatched to customer touchpoint!");
        },
        onError: (err: any) => {
            toast.error(`Resend operation aborted: ${err.message}`);
        }
    });

    // 3. Mutation to REVOKE/DELETE an invitation footprint
    const revokeMutation = useMutation({
        mutationFn: async (inviteId: string) => {
            const res = await striveClientFetch(`/api/v1/members/invites/${inviteId}`, {
                method: "DELETE",
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to drop database reservation footprint.");
        },
        onSuccess: () => {
            toast.success("Invitation access clearance successfully revoked.");
            queryClient.invalidateQueries({ queryKey: ["tenantPendingInvites", tenantId] });
        },
        onError: (err: any) => {
            toast.error(`Revoke operation aborted: ${err.message}`);
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-xs font-bold uppercase tracking-widest text-muted-foreground gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Pulling Pending Access tokens...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <h3 className="font-bold text-sm">Failed to Sync Invitations Log</h3>
                <p className="text-xs text-muted-foreground">Verify workspace authentication states match required admin rules.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-foreground">

            {/* Context Navigation Row */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link
                        href={`/tenants/${subdomain}/members`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors mb-1"
                    >
                        <ArrowLeft className="w-3 h-3" /> Back to Clients Roster
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Pending Invitations</h1>
                    <p className="text-xs text-muted-foreground">Track or manage access passes awaiting authentication check-in</p>
                </div>

                <div className="bg-card px-4 py-2 border border-border rounded-md flex items-center gap-2 font-mono text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="text-muted-foreground">AWAITING ACCEPTANCE:</span>
                    <span className="text-primary font-black">{invites.length}</span>
                </div>
            </div>

            {/* Main Log Registry Table */}
            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-background/80 border-b border-border">
                        <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4 pl-6">INVITEE REACHOUT TARGET</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">ASSIGNED ROLE</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">DISPATCH CHANNELS</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">ISSUED TIMESTAMP</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4 pr-6 text-right">OPERATIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invites.map((invite) => (
                            <TableRow key={invite.id} className="border-b border-border hover:bg-accent/20 transition-colors">

                                {/* Target Identity Info */}
                                <TableCell className="py-4 pl-6">
                                    <div className="flex flex-col gap-0.5">
                                        {invite.email ? (
                                            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {invite.email}
                                            </span>
                                        ) : null}
                                        {invite.phone ? (
                                            <span className={cn(
                                                "font-mono text-xs text-muted-foreground flex items-center gap-1.5",
                                                invite.email && "mt-0.5"
                                            )}>
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {invite.phone}
                                            </span>
                                        ) : null}
                                    </div>
                                </TableCell>

                                {/* System Target RBAC Tier */}
                                <TableCell className="py-4">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-background border border-border text-foreground">
                                        {invite.initialRole || "MEMBER"}
                                    </span>
                                </TableCell>

                                {/* Identified Delivery Channels */}
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        {invite.email && <span className="bg-primary/5 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/10">EMAIL</span>}
                                        {invite.phone && <span className="bg-cyan-500/5 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded border border-cyan-500/10">SMS</span>}
                                    </div>
                                </TableCell>

                                {/* Date Verification Format */}
                                <TableCell className="py-4 font-mono text-xs text-muted-foreground">
                                    {new Date(invite.createdAt || Date.now()).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </TableCell>

                                {/* Quick Administrative Buttons */}
                                <TableCell className="py-4 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => resendMutation.mutate(invite.id)}
                                            disabled={resendMutation.isPending}
                                            className="h-8 text-[11px] font-bold border-border bg-card hover:bg-accent text-foreground gap-1.5"
                                            title="Resend verification link code notice."
                                        >
                                            <Send className="w-3 h-3 text-primary" /> Resend
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                if(confirm("Are you entirely sure you wish to rescind this access invite token? The target user won't be able to activate their workspace link.")) {
                                                    revokeMutation.mutate(invite.id);
                                                }
                                            }}
                                            disabled={revokeMutation.isPending}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            title="Rescind access token permanently."
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>

                            </TableRow>
                        ))}

                        {invites.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                    No outstanding membership invites found awaiting enrollment.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}