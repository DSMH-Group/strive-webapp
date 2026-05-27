// app/tenants/[subdomain]/(admin)/clients/MembersClient.tsx
"use client";

import React, {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Activity, AlertCircle, Loader2, Search, SlidersHorizontal, UserCheck} from "lucide-react";
import {cn} from "@/lib/utils";
import {striveClientFetch} from "@/lib/api";
import {InviteMemberSheet} from "@/components/tenant/shared/InviteMemberSheet";
import {Button} from "@/components/ui/button";
import {ManageMemberSheet} from "@/components/tenant/admin/ManageMemberSheet";

interface MembersClientProps {
    subdomain: string;
    tenantId: string;
}

type FilterStatus = "ALL" | "ACTIVE" | "GRACE" | "SUSPENDED";

export default function MembersClient({subdomain, tenantId}: MembersClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    // 🚀 RESTRICTION: Server-side query restricted specifically via role=MEMBER
    const {data: membersList = [], isLoading, isError, refetch} = useQuery<any[]>({
        queryKey: ["tenantMembersGrid", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members?role=MEMBER", {
                method: "GET",
                headers: {"X-Tenant-ID": tenantId}
            });
            if (!res.ok) throw new Error("Could not parse operational roster.");
            return res.json();
        },
        enabled: !!tenantId
    });

    // --- Dynamic KPI Summary Metric Calculations ---
    const summaryKPIs = useMemo(() => {
        const total = membersList.length;
        const active = membersList.filter(m => m.status === "ACTIVE").length;
        const todayStr = new Date().toISOString().split("T")[0];
        const inGym = membersList.filter(m => m.updatedAt?.startsWith(todayStr)).length;
        const attention = membersList.filter(m => ["GRACE_PERIOD", "SUSPENDED", "REVOKED"].includes(m.status)).length;

        return {total, active, inGym, attention};
    }, [membersList]);

    // --- Filter Handlers ---
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
            if (statusFilter === "SUSPENDED") return member.status === "SUSPENDED";
            return true;
        });
    }, [membersList, searchQuery, statusFilter]);

    if (isLoading) {
        return (
            <div
                className="flex flex-col items-center justify-center py-32 text-xs font-bold uppercase tracking-widest text-muted-foreground gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary"/> Syncing Ecosystem Membership Ledgers...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <AlertCircle className="w-8 h-8 text-destructive"/>
                <h3 className="font-bold text-sm">Roster Handshake Handset Dropped</h3>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Active Clients</h1>
                    <p className="text-xs text-muted-foreground">Manage subscriptions, packages, RFID tags, and entry
                        permissions</p>
                </div>
                <InviteMemberSheet tenantId={tenantId}/>
            </div>

            {/* KPI Block */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="TOTAL MEMBERS" value={summaryKPIs.total}
                             icon={<Activity className="w-3.5 h-3.5 text-muted-foreground"/>}/>
                <SummaryCard title="ACTIVE STATUS" value={summaryKPIs.active}
                             icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400"/>} isGreen/>
                <SummaryCard title="TODAY CHECK-INS" value={summaryKPIs.inGym}
                             icon={<Activity className="w-3.5 h-3.5 text-cyan-400"/>}/>
                <SummaryCard title="ATTENTION REQUIRED" value={summaryKPIs.attention}
                             icon={<AlertCircle className="w-3.5 h-3.5 text-destructive"/>}
                             isAlert={summaryKPIs.attention > 0}/>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search name, phone, or email string parameters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-card/50 border-border pl-10 pr-4 h-10 rounded-md text-sm"
                    />
                </div>
                <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border">
                    <FilterTab label="All" active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}/>
                    <FilterTab label="Active" active={statusFilter === "ACTIVE"}
                               onClick={() => setStatusFilter("ACTIVE")}/>
                    <FilterTab label="Grace" active={statusFilter === "GRACE"}
                               onClick={() => setStatusFilter("GRACE")}/>
                    <FilterTab label="Suspended" active={statusFilter === "SUSPENDED"}
                               onClick={() => setStatusFilter("SUSPENDED")}/>
                </div>
            </div>

            {/* Main Operational Table */}
            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-background/80 border-b border-border">
                        <TableRow className="hover:bg-transparent border-b-0">
                            <TableHead className="text-xs font-bold py-4 pl-6">MEMBER</TableHead>
                            <TableHead className="text-xs font-bold py-4">PLAN REFERENCE</TableHead>
                            <TableHead className="text-xs font-bold py-4">TOKENS REMAINING</TableHead>
                            <TableHead className="text-xs font-bold py-4">STATUS</TableHead>
                            <TableHead className="text-xs font-bold py-4">HARDWARE RFID HEX</TableHead>
                            <TableHead className="text-xs font-bold py-4 text-right pr-6">MANAGEMENT ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((member) => (
                            <TableRow key={member.id}
                                      className="border-b border-border hover:bg-muted/30 group transition-colors">
                                <TableCell className="py-3.5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs text-primary shadow-inner">
                                            {member.user?.firstName?.[0] || "U"}{member.user?.lastName?.[0] || ""}
                                        </div>
                                        <div className="flex flex-col">
                                            <span
                                                className="font-bold text-sm">{member.user?.firstName || "Stride"} {member.user?.lastName || "User"}</span>
                                            <span
                                                className="text-xs text-muted-foreground font-mono mt-0.5">{member.user?.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                    {member.activePlan?.name ||
                                        <span className="text-xs text-muted-foreground italic font-normal">No Active Package</span>}
                                </TableCell>
                                <TableCell className="font-mono text-sm font-bold text-foreground">
                                    {member.tokensLeft ?? 0} <span
                                    className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-medium">tokens</span>
                                </TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded border tracking-wide",
                                        member.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                        ["PENDING", "GRACE_PERIOD"].includes(member.status) && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                        ["SUSPENDED", "CANCELLED", "REVOKED"].includes(member.status) && "bg-destructive/10 text-destructive border-destructive/20"
                                    )}>
                                        {member.status.replace("_", " ")}
                                    </span>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {member.rfidTag ||
                                        <span className="text-muted-foreground/40 italic">UNASSIGNED</span>}
                                </TableCell>
                                <TableCell className="py-3.5 pr-6 text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedMemberId(member.id)}
                                        className="h-8 text-xs font-bold border-border hover:bg-accent gap-1 shadow-sm"
                                    >
                                        <SlidersHorizontal className="w-3 h-3"/> Action Panel
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Unified Action Subpanel Sheet */}
            <ManageMemberSheet
                memberId={selectedMemberId}
                tenantId={tenantId}
                onClose={() => {
                    setSelectedMemberId(null);
                    refetch();
                }}
            />
        </div>
    );
}

function SummaryCard({title, value, icon, isGreen = false, isAlert = false}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    isGreen?: boolean;
    isAlert?: boolean
}) {
    return (
        <Card
            className={cn("bg-card border-border rounded-md p-4 flex flex-col gap-1.5 shadow-sm", isAlert && "ring-1 ring-destructive/20 bg-destructive/5")}>
            <div
                className="flex items-center justify-between text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                <span>{title}</span>
                {icon}
            </div>
            <div
                className={cn("text-2xl font-black font-mono tracking-tight", isGreen ? "text-emerald-400" : isAlert ? "text-destructive" : "text-foreground")}>
                {value}
            </div>
        </Card>
    );
}

function FilterTab({label, active, onClick}: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick}
                className={cn("px-4 py-1.5 rounded-sm text-xs font-bold transition-all text-muted-foreground hover:text-foreground", active && "bg-background text-primary border border-border shadow-sm font-black")}>
            {label}
        </button>
    );
}