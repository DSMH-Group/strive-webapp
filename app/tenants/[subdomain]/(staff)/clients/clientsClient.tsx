// app/tenants/[subdomain]/(admin)/trainer/clients/clientsClient.tsx
"use client";

import React, {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Activity, AlertCircle, Loader2, Plus, Search, UserCheck, Users} from "lucide-react";
import {cn} from "@/lib/utils";
import {striveClientFetch} from "@/lib/api";
import { useRouter } from "next/navigation"

interface TrainerClientsClientProps {
    subdomain: string;
    tenantId: string;
}

type FilterStatus = "ALL" | "ACTIVE" | "GRACE" | "OVERDUE";

export default function TrainerClientsClient({subdomain, tenantId}: TrainerClientsClientProps) {
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

    // 🚀 HOOKED: Fetching real data scoped to your tenant
    const {data: clientsList = [], isLoading, isError} = useQuery({
        queryKey: ["trainerRoster", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/members?role=MEMBER", {
                method: "GET",
                headers: {"X-Tenant-ID": tenantId}
            });
            if (!res.ok) throw new Error("Failed to load trainer roster.");
            return res.json();
        },
        enabled: !!tenantId
    });

    const kpis = useMemo(() => {
        const total = clientsList.length;
        const active = clientsList.filter((c: any) => c.status === "ACTIVE").length;
        // Backend mapping: Check if updatedAt date is today
        const todayStr = new Date().toISOString().split("T")[0];
        const inGym = clientsList.filter((c: any) => c.updatedAt?.startsWith(todayStr)).length;
        const attention = clientsList.filter((c: any) => ["GRACE_PERIOD", "SUSPENDED"].includes(c.status)).length;

        return {total, active, inGym, attention};
    }, [clientsList]);

    const filteredClients = useMemo(() => {
        return clientsList.filter((client: any) => {
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

    if (isLoading) return <div className="flex justify-center py-24"><Loader2
        className="w-8 h-8 animate-spin text-primary"/></div>;

    return (
        <div className="space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                    <p className="text-xs text-muted-foreground">Full gym membership roster</p>
                </div>
                <Button variant="outline" className="h-10 text-xs rounded-md font-bold gap-2 px-4">
                    <Plus className="w-3.5 h-3.5 text-primary"/> Add Client
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="TOTAL" value={kpis.total}
                             icon={<Users className="w-3.5 h-3.5 text-muted-foreground"/>}/>
                <SummaryCard title="ACTIVE" value={kpis.active}
                             icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400"/>} isGreen/>
                <SummaryCard title="IN GYM" value={kpis.inGym} icon={<Activity className="w-3.5 h-3.5 text-cyan-400"/>}
                             isCyan/>
                <SummaryCard title="ATTENTION" value={kpis.attention}
                             icon={<AlertCircle className="w-3.5 h-3.5 text-destructive"/>}
                             isAlert={kpis.attention > 0}/>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-card/50 border-border pl-10 pr-4 h-10 rounded-md text-sm"
                    />
                </div>
                <div
                    className="flex items-center gap-1 bg-background p-1 rounded-md border border-border overflow-x-auto">
                    <FilterTab label="All" active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}/>
                    <FilterTab label="Active" active={statusFilter === "ACTIVE"}
                               onClick={() => setStatusFilter("ACTIVE")}/>
                    <FilterTab label="Grace" active={statusFilter === "GRACE"}
                               onClick={() => setStatusFilter("GRACE")}/>
                    <FilterTab label="Overdue" active={statusFilter === "OVERDUE"}
                               onClick={() => setStatusFilter("OVERDUE")}/>
                </div>
            </div>

            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-background/80 border-b border-border">
                        <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="text-xs font-bold py-4 pl-6">MEMBER</TableHead>
                            <TableHead className="text-xs font-bold py-4">PLAN</TableHead>
                            <TableHead className="text-xs font-bold py-4">STATUS</TableHead>
                            <TableHead className="text-xs font-bold py-4">GOAL</TableHead>
                            <TableHead className="text-xs font-bold py-4">LAST SESSION</TableHead>
                            <TableHead className="text-xs font-bold py-4">TOKENS</TableHead>
                            <TableHead className="text-xs font-bold py-4 pr-6">TRAINER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.map((client: any) => (
                            <TableRow
                                key={client.id}
                                className="border-b border-border hover:bg-accent/40 cursor-pointer transition-colors"
                                onClick={() => router.push(`/clients/${client.id}`)}
                            >
                                {/* 1. MEMBER */}
                                <TableCell className="py-3.5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-9 h-9 rounded-full bg-background border flex items-center justify-center font-bold text-xs text-primary shadow-inner">
                                            {client.user?.firstName?.[0] || "U"}
                                        </div>
                                        <div className="flex flex-col">
                                            <span
                                                className="font-bold text-sm">{client.user?.firstName} {client.user?.lastName}</span>
                                            <span className="text-xs text-muted-foreground">{client.user?.email}</span>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* 2. PLAN */}
                                <TableCell
                                    className="text-sm font-medium">{client.activePlan?.name || "Standard"}</TableCell>

                                {/* 3. STATUS */}
                                <TableCell>
                                    <span
                                        className={cn("text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wide",
                                            client.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                                        )}>
                                        {client.status}
                                    </span>
                                </TableCell>

                                {/* 4. GOAL */}
                                <TableCell className="text-sm text-muted-foreground">{client.goal || "—"}</TableCell>

                                {/* 5. LAST SESSION */}
                                <TableCell
                                    className="text-sm font-medium text-foreground">{client.lastSession || "—"}</TableCell>

                                {/* 6. TOKENS */}
                                <TableCell className="font-mono text-sm font-bold">{client.tokensLeft ?? 0}</TableCell>

                                {/* 7. TRAINER */}
                                <TableCell
                                    className="text-sm font-medium pr-6">{client.trainer || "Unassigned"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

// --- Supporting Presentational Primitives ---

function TrashHead({className}: { className?: string }) {
    return <TableHead className={className}/>;
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
            <div
                className="flex items-center justify-between text-[10px] font-bold text-muted-foreground tracking-wider">
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