// app/tenants/[subdomain]/(admin)/trainer/clients/clientsClient.tsx
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
    Search,
    ChevronRight,
    UserCheck,
    AlertCircle,
    Activity,
    Users,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TrainerClientsClientProps {
    subdomain: string;
    initialClients: any[];
}

type FilterStatus = "ALL" | "ACTIVE" | "GRACE" | "OVERDUE";

export default function TrainerClientsClient({ subdomain, initialClients = [] }: TrainerClientsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

    // --- Core Roster Data ---
    const clientsList = useMemo(() => {
        if (initialClients.length > 0) return initialClients;

        return [
            {
                id: "c-01",
                user: { firstName: "Amara", lastName: "Silva", email: "amara@gmail.com" },
                plan: "Premium",
                status: "ACTIVE",
                goal: "Weight Loss",
                lastSession: "2d ago",
                tokens: 12,
                trainer: "Ravi K."
            },
            {
                id: "c-02",
                user: { firstName: "Dilshan", lastName: "Raj", email: "dilshan@gmail.com" },
                plan: "Standard",
                status: "ACTIVE",
                goal: "Muscle Gain",
                lastSession: "Today",
                tokens: 6,
                trainer: "Ravi K."
            },
            {
                id: "c-03",
                user: { firstName: "Thilini", lastName: "Perera", email: "thilini@yahoo.com" },
                plan: "Premium",
                status: "GRACE_PERIOD",
                goal: "Endurance",
                lastSession: "5d ago",
                tokens: 2,
                trainer: "Shani L."
            },
            {
                id: "c-04",
                user: { firstName: "Kasun", lastName: "Mendis", email: "kasun@gmail.com" },
                plan: "Standard",
                status: "ACTIVE",
                goal: "Strength",
                lastSession: "Today",
                tokens: 9,
                trainer: "Ravi K."
            },
            {
                id: "c-05",
                user: { firstName: "Nimal", lastName: "Fernando", email: "nimal@hotmail.com" },
                plan: "Basic",
                status: "SUSPENDED",
                goal: "General Fitness",
                lastSession: "12d ago",
                tokens: 0,
                trainer: "None"
            },
            {
                id: "c-06",
                user: { firstName: "Ruwani", lastName: "Jayawardena", email: "ruwani@gmail.com" },
                plan: "Premium",
                status: "ACTIVE",
                goal: "Weight Loss",
                lastSession: "1d ago",
                tokens: 15,
                trainer: "Shani L."
            }
        ];
    }, [initialClients]);

    // --- Metrics Summaries ---
    const kpis = useMemo(() => {
        const total = clientsList.length;
        const active = clientsList.filter(c => c.status === "ACTIVE").length;
        const inGym = clientsList.filter(c => c.lastSession === "Today").length;
        const attention = clientsList.filter(c => c.status === "GRACE_PERIOD" || c.status === "SUSPENDED").length;

        return { total, active, inGym, attention };
    }, [clientsList]);

    // --- Reactive Search and Tab Filter Sorting ---
    const filteredClients = useMemo(() => {
        return clientsList.filter(client => {
            const fullName = `${client.user?.firstName || ""} ${client.user?.lastName || ""}`.toLowerCase();
            const email = (client.user?.email || "").toLowerCase();
            const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === "ACTIVE") return client.status === "ACTIVE";
            if (statusFilter === "GRACE") return client.status === "GRACE_PERIOD";
            if (statusFilter === "OVERDUE") return client.status === "SUSPENDED";
            return true;
        });
    }, [clientsList, searchQuery, statusFilter]);

    return (
        <div className="space-y-6 text-foreground">

            {/* Action Top Bar Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                    <p className="text-xs text-muted-foreground">Full gym membership roster</p>
                </div>
                <Button
                    onClick={() => toast.success("Opening onboarding modal workflow...")}
                    variant="outline"
                    className="h-10 text-xs border-border bg-card text-foreground rounded-md font-bold gap-2 px-4"
                >
                    <Plus className="w-3.5 h-3.5 text-primary" /> Add Member
                </Button>
            </div>

            {/* KPI Summary Block Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="TOTAL" value={kpis.total} icon={<Users className="w-3.5 h-3.5 text-muted-foreground" />} />
                <SummaryCard title="ACTIVE" value={kpis.active} icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400" />} isGreen />
                <SummaryCard title="IN GYM" value={kpis.inGym} icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />} isCyan />
                <SummaryCard title="ATTENTION" value={kpis.attention} icon={<AlertCircle className="w-3.5 h-3.5 text-destructive" />} isAlert={kpis.attention > 0} />
            </div>

            {/* Filter Control Inputs Layer */}
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

                {/* Segmented Selectors */}
                <div className="flex items-center gap-1 bg-background p-1 rounded-md border border-border overflow-x-auto">
                    <FilterTab label="All" active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} />
                    <FilterTab label="Active" active={statusFilter === "ACTIVE"} onClick={() => setStatusFilter("ACTIVE")} />
                    <FilterTab label="Grace" active={statusFilter === "GRACE"} onClick={() => setStatusFilter("GRACE")} />
                    <FilterTab label="Overdue" active={statusFilter === "OVERDUE"} onClick={() => setStatusFilter("OVERDUE")} />
                </div>
            </div>

            {/* Roster Layout Table Wrapper Component */}
            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-background/80 border-b border-border">
                        <TableRow className="border-b border-border hover:bg-transparent">
                            <TrashHead className="hidden" /> {/* Structural tracking cell spacer if needed */}
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
                        {filteredClients.map((client) => (
                            <TableRow
                                key={client.id}
                                className="border-b border-border hover:bg-accent/40 group cursor-pointer transition-colors"
                                onClick={() => toast.info(`Opening metric session logger for ${client.user?.firstName}...`)}
                            >
                                {/* Member Identity Core Elements */}
                                <TableCell className="py-3.5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center font-bold text-xs text-primary shadow-inner">
                                            {client.user?.firstName?.[0] || "U"}{client.user?.lastName?.[0] || ""}
                                            <div className={cn(
                                                "absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border-2 border-background",
                                                client.status === "ACTIVE" ? "bg-emerald-500" : client.status === "GRACE_PERIOD" ? "bg-amber-500" : "bg-destructive"
                                            )} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {client.user?.firstName || "Unknown"} {client.user?.lastName || ""}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate mt-0.5">{client.user?.email}</span>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Plan Matrix Information */}
                                <TableCell className="text-muted-foreground text-sm py-3.5">
                                    {client.plan}
                                </TableCell>

                                {/* Operational State Badge Configurations */}
                                <TableCell className="py-3.5">
                                    <span className={cn(
                                        "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wide",
                                        client.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                        client.status === "GRACE_PERIOD" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                        client.status === "SUSPENDED" && "bg-destructive/10 text-destructive border-destructive/20"
                                    )}>
                                        {client.status === "ACTIVE" ? "Active" : client.status === "GRACE_PERIOD" ? "Grace" : "Overdue"}
                                    </span>
                                </TableCell>

                                {/* Fitness Goal Field Metadata */}
                                <TableCell className="text-muted-foreground text-sm py-3.5">
                                    {client.goal}
                                </TableCell>

                                {/* Last Session Activity Markers */}
                                <TableCell className={cn(
                                    "text-sm font-medium py-3.5",
                                    client.lastSession === "Today" ? "text-primary font-bold" : "text-muted-foreground"
                                )}>
                                    {client.lastSession}
                                </TableCell>

                                {/* Token Matrix Remaining Resource Weights */}
                                <TableCell className="font-mono text-sm font-bold text-muted-foreground py-3.5">
                                    {client.tokens}
                                </TableCell>

                                {/* Linked Dedicated Human Resource Row */}
                                <TableCell className="py-3.5 pr-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">{client.trainer}</span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}

                        {filteredClients.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                                    No records found matching active trainer scoping criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

// --- Supporting Presentational Primitives ---

function TrashHead({ className }: { className?: string }) {
    return <TableHead className={className} />;
}

function SummaryCard({
                         title,
                         value,
                         icon,
                         isGreen = false,
                         isCyan = false,
                         isAlert = false
                     }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    isGreen?: boolean;
    isCyan?: boolean;
    isAlert?: boolean;
}) {
    return (
        <Card className={cn(
            "bg-card border-border rounded-md p-4 flex flex-col gap-1.5 transition-all hover:border-muted-foreground/20",
            isAlert && "ring-1 ring-destructive/20 bg-destructive/5"
        )}>
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground tracking-wider">
                <span>{title}</span>
                {icon}
            </div>
            <div className={cn(
                "text-2xl font-black font-mono tracking-tight",
                isGreen ? "text-emerald-400" : isCyan ? "text-cyan-400" : isAlert ? "text-destructive" : "text-foreground"
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