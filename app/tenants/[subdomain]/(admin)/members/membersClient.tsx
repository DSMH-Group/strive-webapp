"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    UserPlus,
    Search,
    ChevronRight,
    UserCheck,
    AlertCircle,
    Activity,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";

interface MembersClientProps {
    subdomain: string;
    tenantId: string; // Dynamic database UUID forwarded down from your server layout context
}

type FilterStatus = "ALL" | "ACTIVE" | "GRACE" | "OVERDUE";

export default function MembersClient({ subdomain, tenantId }: MembersClientProps) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // --- Invitation Form Client States ---
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePhone, setInvitePhone] = useState("");
    const [inviteRole, setInviteRole] = useState<"MEMBER" | "TRAINER" | "MANAGER" | "ORG_ADMIN">("MEMBER");

    // 🚀 STEP 1: Wire up live data query hook to GET /api/v1/members
    const { data: membersList = [], isLoading, isError } = useQuery<any[]>({
        queryKey: ["tenantMembersGrid", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members", {
                method: "GET",
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Could not parse operational roster.");
            return res.json();
        },
        enabled: !!tenantId
    });

    // 🚀 STEP 2: Wire up invitation mutation hook to POST /api/v1/members/invites
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
            queryClient.invalidateQueries({ queryKey: ["tenantMembersGrid", tenantId] });
            // Reset modal layout parameters
            setInviteEmail("");
            setInvitePhone("");
            setInviteRole("MEMBER");
            setIsInviteOpen(false);
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

    // --- Dynamic Analytics Summary Calculations ---
    const summaryKPIs = useMemo(() => {
        const total = membersList.length;
        const active = membersList.filter(m => m.status === "ACTIVE").length;

        // Handling dynamic offline/online checks safely against metadata array layouts
        const todayStr = new Date().toISOString().split("T")[0];
        const inGym = membersList.filter(m => m.lastSession === "Today" || m.updatedAt?.startsWith(todayStr)).length;
        const attention = membersList.filter(m => m.status === "GRACE_PERIOD" || m.status === "SUSPENDED").length;

        return { total, active, inGym, attention };
    }, [membersList]);

    // --- Reactive List Filtering Logic ---
    const filteredMembers = useMemo(() => {
        return membersList.filter(member => {
            const firstName = member.user?.firstName || "";
            const lastName = member.user?.lastName || "";
            const fullName = `${firstName} ${lastName}`.toLowerCase();
            const email = (member.user?.email || "").toLowerCase();
            const searchMatch = fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());

            if (!searchMatch) return false;

            if (statusFilter === "ACTIVE") return member.status === "ACTIVE";
            if (statusFilter === "GRACE") return member.status === "GRACE_PERIOD";
            if (statusFilter === "OVERDUE") return member.status === "SUSPENDED";
            return true;
        });
    }, [membersList, searchQuery, statusFilter]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-xs font-bold uppercase tracking-widest text-muted-foreground gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Synchronizing Tenant Membership Ledger...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <h3 className="font-bold text-sm">Roster Sync Pipeline Broken</h3>
                <p className="text-xs text-muted-foreground">Confirm your network session handshake clearance credentials remain valid.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-foreground">

            {/* Top Operational Header Action Row */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                    <p className="text-xs text-muted-foreground">Full multi-tenant operational roster</p>
                </div>

                {/* Secure Invitation Dialog Workflow Modal */}
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger>
                        <Button variant="outline" className="h-10 text-xs border-border bg-card text-foreground rounded-md font-bold gap-2 px-4 hover:bg-accent">
                            <UserPlus className="w-3.5 h-3.5 text-primary" /> Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Onboard Workspace Identity</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground/80">
                                Send an edge authentication invite linking a user to this facility workspace domain.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="nimal.perera@example.lk"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="bg-background border-border text-sm h-10"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number (Sri Lankan Format)</label>
                                <Input
                                    type="text"
                                    placeholder="+94771234567"
                                    value={invitePhone}
                                    onChange={(e) => setInvitePhone(e.target.value)}
                                    className="bg-background border-border text-sm h-10 font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Initial Workspace RBAC Tier</label>
                                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                                    <SelectTrigger className="bg-background border-border text-xs h-10">
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
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsInviteOpen(false)} className="text-xs">Cancel</Button>
                                <Button type="submit" size="sm" disabled={inviteMutation.isPending} className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                                    {inviteMutation.isPending ? "Dispatching..." : "Send Invitation"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Roster KPI Summary Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="TOTAL" value={summaryKPIs.total} icon={<Activity className="w-3.5 h-3.5 text-muted-foreground" />} />
                <SummaryCard title="ACTIVE" value={summaryKPIs.active} icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400" />} isGreen />
                <SummaryCard title="IN GYM" value={summaryKPIs.inGym} icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />} />
                <SummaryCard title="ATTENTION" value={summaryKPIs.attention} icon={<AlertCircle className="w-3.5 h-3.5 text-destructive" />} isAlert={summaryKPIs.attention > 0} />
            </div>

            {/* Grid Controls: Search Input & Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-card/50 border-border pl-10 pr-4 h-10 rounded-md text-foreground text-sm"
                    />
                </div>

                <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border overflow-x-auto">
                    <FilterTab label="All" active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
                    <FilterTab label="Active" active={statusFilter === "ACTIVE"} onClick={() => setStatusFilter("ACTIVE")} />
                    <FilterTab label="Grace" active={statusFilter === "GRACE"} onClick={() => setStatusFilter("GRACE")} />
                    <FilterTab label="Overdue" active={statusFilter === "OVERDUE"} onClick={() => setStatusFilter("OVERDUE")} />
                </div>
            </div>

            {/* Primary Live Operational Data Table */}
            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-background/80 border-b border-border">
                        <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4 pl-6">MEMBER</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">PLAN / ID</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">STATUS</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">RFID TAG</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">LAST SYNC</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4 pr-6">ACTION</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((member) => (
                            <TableRow
                                key={member.id}
                                className="border-b border-border hover:bg-accent/40 group cursor-pointer transition-colors"
                                onClick={() => toast.info(`Viewing system record: ${member.id.slice(0, 8)}`)}
                            >
                                {/* Member Profile Block */}
                                <TableCell className="py-3.5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs text-primary shadow-inner">
                                            {member.user?.firstName?.[0] || "U"}{member.user?.lastName?.[0] || ""}
                                            <div className={cn(
                                                "absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border-2 border-background",
                                                member.status === "ACTIVE" ? "bg-emerald-500" : member.status === "PENDING" ? "bg-amber-500" : "bg-destructive"
                                            )} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {member.user?.firstName || "Stride"} {member.user?.lastName || "User"}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate mt-0.5">{member.user?.email || "No Email Bound"}</span>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Plan and Identifier Fields */}
                                <TableCell className="text-muted-foreground font-mono text-xs py-3.5">
                                    {member.plan || `MEM-${member.id.slice(0, 5).toUpperCase()}`}
                                </TableCell>

                                {/* Structural State Configuration Tag */}
                                <TableCell className="py-3.5">
                                    <span className={cn(
                                        "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wide",
                                        member.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                        member.status === "PENDING" || member.status === "GRACE_PERIOD" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "",
                                        (member.status === "SUSPENDED" || member.status === "REVOKED") && "bg-destructive/10 text-destructive border-destructive/20"
                                    )}>
                                        {member.status}
                                    </span>
                                </TableCell>

                                {/* RFID Tag Column */}
                                <TableCell className="text-muted-foreground font-mono text-xs py-3.5">
                                    <span className="bg-background border border-border rounded px-2 py-0.5">
                                        {member.rfidTag || "UNASSIGNED"}
                                    </span>
                                </TableCell>

                                {/* Date Verification Strings */}
                                <TableCell className="text-xs font-mono text-muted-foreground py-3.5">
                                    {new Date(member.updatedAt || member.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                    })}
                                </TableCell>

                                {/* Chevron Trigger Wrapper */}
                                <TableCell className="py-3.5 pr-6 text-right">
                                    <div className="flex items-center justify-end">
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}

                        {filteredMembers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                                    No member records matched your active filter scope.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

// --- Local Presentation Sub-components ---

function SummaryCard({ title, value, icon, isGreen = false, isAlert = false }: { title: string; value: number; icon: React.ReactNode; isGreen?: boolean; isAlert?: boolean }) {
    return (
        <Card className={cn(
            "bg-card border-border rounded-md p-4 flex flex-col gap-1.5 transition-all hover:border-muted-foreground/20",
            isAlert && "ring-1 ring-destructive/20 bg-destructive/5"
        )}>
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>{title}</span>
                {icon}
            </div>
            <div className={cn(
                "text-2xl font-black font-mono tracking-tight",
                isGreen ? "text-emerald-400" : isAlert ? "text-destructive" : "text-foreground"
            )}>
                {value}
            </div>
        </Card>
    );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-1.5 rounded-sm text-xs font-bold transition-all text-muted-foreground hover:text-foreground",
                active && "bg-background text-primary border border-border shadow-md font-black"
            )}
        >
            {label}
        </button>
    );
}