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
    Activity,
    ShieldAlert
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

    // --- Core Normalized Mock Data for Hydration (Matching Layout Mockup closely) ---
    const activeMembersList = useMemo(() => {
        if (initialMembers.length > 0) return initialMembers;

        // Comprehensive fallback data explicitly detailing local Sri Lankan operator rosters
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
                status: "GRACE_PERIOD", // Maps directly to State Machine Buffer (SRS 5.1)
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
                status: "SUSPENDED", // Overdue indicator for collection failure overrides
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

        // "In Gym" reflects active real-time attendance triggers matching today's footfall parameters
        const inGym = activeMembersList.filter(m => m.lastSession === "Today").length;

        // "Attention" tags status exceptions requiring desk adjustments (Grace & Suspended configurations)
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
        <div className="space-y-6 animate-in fade-in duration-300 text-white select-none">

            {/* Top Operational Header Action Row */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                    <p className="text-xs text-zinc-500">Full gym membership roster</p>
                </div>
                <Button
                    onClick={() => toast.success("Initializing unified onboarding workflow...")}
                    className="bg-zinc-900 text-emerald-400 border border-emerald-500/20 hover:bg-zinc-800 rounded-xl h-10 text-xs font-bold gap-2 px-4 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                >
                    <UserPlus className="w-3.5 h-3.5" /> Add Member
                </Button>
            </div>

            {/* Quick-Glance Top Roster KPI Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="TOTAL" value={summaryKPIs.total} icon={<Activity className="w-3.5 h-3.5 text-zinc-400" />} />
                <SummaryCard title="ACTIVE" value={summaryKPIs.active} icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400" />} isGreen />
                <SummaryCard title="IN GYM" value={summaryKPIs.inGym} icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />} />
                <SummaryCard title="ATTENTION" value={summaryKPIs.attention} icon={<AlertCircle className="w-3.5 h-3.5 text-amber-500" />} isAlert={summaryKPIs.attention > 0} />
            </div>

            {/* Comprehensive Grid Controls: Search Input & Segmented Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-900/50 border-white/5 pl-10 pr-4 h-10 rounded-xl text-zinc-200 text-sm focus-visible:ring-primary/20 placeholder:text-zinc-600"
                    />
                </div>

                {/* Visual Selector Tabs Matching Uploaded Mock Style Sheet */}
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5 overflow-x-auto">
                    <FilterTab label="All" active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
                    <FilterTab label="Active" active={statusFilter === "ACTIVE"} onClick={() => setStatusFilter("ACTIVE")} />
                    <FilterTab label="Grace" active={statusFilter === "GRACE"} onClick={() => setStatusFilter("GRACE")} />
                    <FilterTab label="Overdue" active={statusFilter === "OVERDUE"} onClick={() => setStatusFilter("OVERDUE")} />
                </div>
            </div>

            {/* Primary Live Operational Data Table */}
            <Card className="bg-zinc-900/30 border-white/5 rounded-[1.5rem] overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-950/80 border-b border-white/5">
                        <TableRow className="border-b border-white/5 hover:bg-transparent">
                            <TableHead className="text-zinc-500 text-xs font-bold tracking-wider py-4 pl-6">MEMBER</TableHead>
                            <TableHead className="text-zinc-500 text-xs font-bold tracking-wider py-4">PLAN</TableHead>
                            <TableHead className="text-zinc-500 text-xs font-bold tracking-wider py-4">STATUS</TableHead>
                            <TableHead className="text-zinc-500 text-xs font-bold tracking-wider py-4">GOAL</TableHead>
                            <TableHead className="text-zinc-500 text-xs font-bold tracking-wider py-4">LAST SESSION</TableHead>
                            <TableHead className="text-zinc-500 text-xs font-bold tracking-wider py-4">TOKENS</TableHead>
                            <TableHead className="text-zinc-500 text-xs font-bold tracking-wider py-4 pr-6">TRAINER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((member) => (
                            <TableRow
                                key={member.id}
                                className="border-b border-white/5 hover:bg-zinc-900/40 group cursor-pointer transition-colors"
                                onClick={() => toast.info(`Accessing workspace lifecycle view for ${member.user?.firstName}`)}
                            >
                                {/* Member Identity Core Block */}
                                <TableCell className="py-3.5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-amber-200 border border-white/5 shadow-inner">
                                            {member.user?.firstName?.[0] || "U"}{member.user?.lastName?.[0] || ""}
                                            <div className={cn(
                                                "absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border-2 border-zinc-900",
                                                member.status === "ACTIVE" ? "bg-emerald-500" : member.status === "GRACE_PERIOD" ? "bg-amber-500" : "bg-rose-500"
                                            )} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm text-zinc-100 group-hover:text-primary transition-colors">
                                                {member.user?.firstName || "Unknown"} {member.user?.lastName || ""}
                                            </span>
                                            <span className="text-xs text-zinc-500 truncate mt-0.5">{member.user?.email}</span>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Plan Matrix Mapping */}
                                <TableCell className="text-zinc-300 text-sm py-3.5">
                                    {member.plan}
                                </TableCell>

                                {/* Structural State Configuration */}
                                <TableCell className="py-3.5">
                                    <span className={cn(
                                        "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wide",
                                        member.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                        member.status === "GRACE_PERIOD" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                        member.status === "SUSPENDED" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                    )}>
                                        {member.status === "ACTIVE" ? "Active" : member.status === "GRACE_PERIOD" ? "Grace" : "Overdue"}
                                    </span>
                                </TableCell>

                                {/* JSONB Dynamic Data Fields */}
                                <TableCell className="text-zinc-400 text-sm py-3.5">
                                    {member.metadata?.goal || "General"}
                                </TableCell>

                                {/* Attendance Aggregations */}
                                <TableCell className={cn(
                                    "text-sm font-medium py-3.5",
                                    member.lastSession === "Today" ? "text-cyan-400 font-bold" : "text-zinc-400"
                                )}>
                                    {member.lastSession}
                                </TableCell>

                                {/* Token Balances */}
                                <TableCell className="font-mono text-sm font-bold text-zinc-300 py-3.5">
                                    {member.metadata?.tokens ?? 0}
                                </TableCell>

                                {/* Resource Allocation Block */}
                                <TableCell className="py-3.5 pr-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-sm">{member.trainer}</span>
                                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}

                        {filteredMembers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-zinc-500 text-sm">
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
            "bg-zinc-900/40 border-white/5 rounded-2xl p-4 flex flex-col gap-1.5 transition-all hover:border-white/10",
            isAlert && "ring-1 ring-rose-500/20 bg-rose-950/5"
        )}>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 tracking-wider">
                <span>{title}</span>
                {icon}
            </div>
            <div className={cn(
                "text-2xl font-black font-mono tracking-tight",
                isGreen ? "text-emerald-400" : isAlert ? "text-rose-400" : "text-white"
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
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-zinc-200",
                active && "bg-zinc-900 text-amber-500 border border-amber-500/10 shadow-lg font-black"
            )}
        >
            {label}
        </button>
    );
}