// app/tenants/[subdomain]/(admin)/members/membersClient.tsx
"use client";

import React, { useState, useMemo } from "react";
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
    UserPlus,
    Search,
    ChevronRight,
    UserCheck,
    AlertCircle,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MembersClientProps {
    subdomain: string;
    initialMembers: any[];
}

type FilterStatus = "ALL" | "ACTIVE" | "GRACE" | "OVERDUE";

export default function MembersClient({ subdomain, initialMembers = [] }: MembersClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

    // --- Core Normalized Mock Data for Hydration ---
    const activeMembersList = useMemo(() => {
        if (initialMembers.length > 0) return initialMembers;

        return [
            {
                id: "mem-01",
                user: { firstName: "Amara", lastName: "Silva", email: "amara@gmail.com" },
                plan: "Premium",
                status: "ACTIVE",
                metadata: { goal: "Weight Loss", tokens: 12 },
                lastSession: "2d ago",
                trainer: "Ravi K."
            },
            {
                id: "mem-02",
                user: { firstName: "Dilshan", lastName: "Raj", email: "dilshan@gmail.com" },
                plan: "Standard",
                status: "ACTIVE",
                metadata: { goal: "Muscle Gain", tokens: 6 },
                lastSession: "Today",
                trainer: "Ravi K."
            },
            {
                id: "mem-03",
                user: { firstName: "Thilini", lastName: "Perera", email: "thilini@yahoo.com" },
                plan: "Premium",
                status: "GRACE_PERIOD",
                metadata: { goal: "Endurance", tokens: 2 },
                lastSession: "5d ago",
                trainer: "Shani L."
            },
            {
                id: "mem-04",
                user: { firstName: "Kasun", lastName: "Mendis", email: "kasun@gmail.com" },
                plan: "Standard",
                status: "ACTIVE",
                metadata: { goal: "Strength", tokens: 9 },
                lastSession: "Today",
                trainer: "Ravi K."
            },
            {
                id: "mem-05",
                user: { firstName: "Nimal", lastName: "Fernando", email: "nimal@hotmail.com" },
                plan: "Basic",
                status: "SUSPENDED",
                metadata: { goal: "General Fitness", tokens: 0 },
                lastSession: "12d ago",
                trainer: "None"
            },
            {
                id: "mem-06",
                user: { firstName: "Ruwani", lastName: "Jayawardena", email: "ruwani@gmail.com" },
                plan: "Premium",
                status: "ACTIVE",
                metadata: { goal: "Weight Loss", tokens: 15 },
                lastSession: "1d ago",
                trainer: "Shani L."
            }
        ];
    }, [initialMembers]);

    // --- Dynamic Analytics Summary Card Calculations ---
    const summaryKPIs = useMemo(() => {
        const total = activeMembersList.length;
        const active = activeMembersList.filter(m => m.status === "ACTIVE").length;
        const inGym = activeMembersList.filter(m => m.lastSession === "Today").length;
        const attention = activeMembersList.filter(m => m.status === "GRACE_PERIOD" || m.status === "SUSPENDED").length;

        return { total, active, inGym, attention };
    }, [activeMembersList]);

    // --- Reactive List Filtering Core Logic ---
    const filteredMembers = useMemo(() => {
        return activeMembersList.filter(member => {
            const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.toLowerCase();
            const email = (member.user?.email || "").toLowerCase();
            const searchMatch = fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());

            if (!searchMatch) return false;

            if (statusFilter === "ACTIVE") return member.status === "ACTIVE";
            if (statusFilter === "GRACE") return member.status === "GRACE_PERIOD";
            if (statusFilter === "OVERDUE") return member.status === "SUSPENDED";
            return true;
        });
    }, [activeMembersList, searchQuery, statusFilter]);

    return (
        <div className="space-y-6 text-foreground">

            {/* Top Operational Header Action Row */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                    <p className="text-xs text-muted-foreground">Full gym membership roster</p>
                </div>
                <Button
                    onClick={() => toast.success("Initializing unified onboarding workflow...")}
                    variant="outline"
                    className="h-10 text-xs border-border bg-card text-foreground rounded-md font-bold gap-2 px-4"
                >
                    <UserPlus className="w-3.5 h-3.5 text-primary" /> Add Member
                </Button>
            </div>

            {/* Quick-Glance Top Roster KPI Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="TOTAL" value={summaryKPIs.total} icon={<Activity className="w-3.5 h-3.5 text-muted-foreground" />} />
                <SummaryCard title="ACTIVE" value={summaryKPIs.active} icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400" />} isGreen />
                <SummaryCard title="IN GYM" value={summaryKPIs.inGym} icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />} />
                <SummaryCard title="ATTENTION" value={summaryKPIs.attention} icon={<AlertCircle className="w-3.5 h-3.5 text-destructive" />} isAlert={summaryKPIs.attention > 0} />
            </div>

            {/* Comprehensive Grid Controls: Search Input & Segmented Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-card/50 border-border pl-10 pr-4 h-10 rounded-md text-foreground text-sm focus-visible:ring-primary/20 placeholder:text-muted-foreground"
                    />
                </div>

                {/* Visual Selector Tabs */}
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
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">PLAN</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">STATUS</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">GOAL</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">LAST SESSION</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4">TOKENS</TableHead>
                            <TableHead className="text-muted-foreground text-xs font-bold tracking-wider py-4 pr-6">TRAINER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((member) => (
                            <TableRow
                                key={member.id}
                                className="border-b border-border hover:bg-accent/40 group cursor-pointer transition-colors"
                                onClick={() => toast.info(`Accessing workspace lifecycle view for ${member.user?.firstName}`)}
                            >
                                {/* Member Identity Core Block */}
                                <TableCell className="py-3.5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs text-primary shadow-inner">
                                            {member.user?.firstName?.[0] || "U"}{member.user?.lastName?.[0] || ""}
                                            <div className={cn(
                                                "absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border-2 border-background",
                                                member.status === "ACTIVE" ? "bg-emerald-500" : member.status === "GRACE_PERIOD" ? "bg-amber-500" : "bg-destructive"
                                            )} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {member.user?.firstName || "Unknown"} {member.user?.lastName || ""}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate mt-0.5">{member.user?.email}</span>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Plan Matrix Mapping */}
                                <TableCell className="text-muted-foreground text-sm py-3.5">
                                    {member.plan}
                                </TableCell>

                                {/* Structural State Configuration */}
                                <TableCell className="py-3.5">
                                    <span className={cn(
                                        "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wide",
                                        member.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                        member.status === "GRACE_PERIOD" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                        member.status === "SUSPENDED" && "bg-destructive/10 text-destructive border-destructive/20"
                                    )}>
                                        {member.status === "ACTIVE" ? "Active" : member.status === "GRACE_PERIOD" ? "Grace" : "Overdue"}
                                    </span>
                                </TableCell>

                                {/* JSONB Dynamic Data Fields */}
                                <TableCell className="text-muted-foreground text-sm py-3.5">
                                    {member.metadata?.goal || "General"}
                                </TableCell>

                                {/* Attendance Aggregations */}
                                <TableCell className={cn(
                                    "text-sm font-medium py-3.5",
                                    member.lastSession === "Today" ? "text-primary font-bold" : "text-muted-foreground"
                                )}>
                                    {member.lastSession}
                                </TableCell>

                                {/* Token Balances */}
                                <TableCell className="font-mono text-sm font-bold text-muted-foreground py-3.5">
                                    {member.metadata?.tokens ?? 0}
                                </TableCell>

                                {/* Resource Allocation Block */}
                                <TableCell className="py-3.5 pr-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">{member.trainer}</span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}

                        {filteredMembers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
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

function SummaryCard({
                         title,
                         value,
                         icon,
                         isGreen = false,
                         isAlert = false
                     }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    isGreen?: boolean;
    isAlert?: boolean;
}) {
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

function FilterTab({
                       label,
                       active,
                       onClick
                   }: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
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