// app/tenants/[subdomain]/(admin)/settings/MembershipPlans.tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";
import { SectionHeader } from "@/app/tenants/[subdomain]/(admin)/settings/settingsClient";
import { cn } from "@/lib/utils";

interface MembershipPlansProps {
    tenantId: string;
    onComplete: () => void;
}

interface PlanFormData {
    id?: string;
    name: string;
    monthlyPrice: number | string;
    sessionTokens: number | string;
}

export function MembershipPlans({ tenantId, onComplete }: MembershipPlansProps) {
    const queryClient = useQueryClient();

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState<PlanFormData>({ name: "", monthlyPrice: "", sessionTokens: "" });

    // --- API Interactions ---

    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ["tenantPlans", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/plans?includeInactive=true", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to fetch plans");
            return res.json();
        }
    });

    const savePlanMutation = useMutation({
        mutationFn: async (data: PlanFormData) => {
            const headers = { "X-Tenant-ID": tenantId, "Content-Type": "application/json" };
            const isEdit = !!data.id;
            const url = isEdit ? `/api/v1/plans/${data.id}` : `/api/v1/plans`;

            const res = await striveClientFetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers,
                body: JSON.stringify({
                    name: data.name,
                    monthlyPrice: Number(data.monthlyPrice),
                    sessionTokens: Number(data.sessionTokens)
                })
            });

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            // Return empty object for 204 No Content, else parse JSON
            return res.status === 204 ? {} : res.json();
        },
        onSuccess: () => {
            toast.success(`Plan ${formData.id ? "updated" : "created"} successfully.`);
            queryClient.invalidateQueries({ queryKey: ["tenantPlans", tenantId] });
            setIsSidebarOpen(false);
        },
        onError: (err: any) => toast.error(`Failed to save plan: ${err.message}`)
    });

    const deletePlanMutation = useMutation({
        mutationFn: async (planId: string) => {
            const headers = { "X-Tenant-ID": tenantId };
            const res = await striveClientFetch(`/api/v1/plans/${planId}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error("Failed to delete plan");
        },
        onSuccess: () => {
            toast.success("Plan deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["tenantPlans", tenantId] });
        },
        onError: (err: any) => toast.error(`Failed to delete plan: ${err.message}`)
    });

    // --- Handlers ---

    const openSidebarForAdd = () => {
        setFormData({ name: "", monthlyPrice: "", sessionTokens: "" });
        setIsSidebarOpen(true);
    };

    const openSidebarForEdit = (plan: any) => {
        setFormData({
            id: plan.id,
            name: plan.name,
            monthlyPrice: plan.monthlyPrice,
            sessionTokens: plan.sessionTokens
        });
        setIsSidebarOpen(true);
    };

    const handleFormSubmit = () => {
        if (!formData.name || formData.monthlyPrice === "" || formData.sessionTokens === "") {
            toast.error("Please fill in all required fields.");
            return;
        }
        savePlanMutation.mutate(formData);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                <SectionHeader title="Membership Plans" desc="Pricing and session token allocation per plan" />
                <Button
                    onClick={openSidebarForAdd}
                    variant="outline"
                    className="h-9 gap-1.5 text-xs font-bold border-border bg-background"
                >
                    <Plus className="w-3.5 h-3.5 text-primary" /> Add Plan
                </Button>
            </div>

            <Card className="bg-card/30 border-border rounded-lg overflow-hidden">
                {plansLoading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-card/50 border-b border-border">
                            <TableRow className="border-b-0 hover:bg-transparent">
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider w-1/3">
                                    PLAN NAME
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider">
                                    PRICE (LKR)
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider">
                                    TOKENS
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider text-right pr-4">
                                    ACTIONS
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan: any) => (
                                <TableRow key={plan.id} className="border-b border-border hover:bg-muted/30 group">
                                    <TableCell className="py-4 font-bold text-sm">
                                        {plan.name}
                                    </TableCell>
                                    <TableCell className="py-4 font-mono text-sm text-muted-foreground">
                                        {Number(plan.monthlyPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="py-4 font-mono text-sm text-muted-foreground">
                                        {plan.sessionTokens}
                                    </TableCell>
                                    <TableCell className="py-4 text-right pr-4">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openSidebarForEdit(plan)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to delete ${plan.name}?`)) {
                                                        deletePlanMutation.mutate(plan.id);
                                                    }
                                                }}
                                                disabled={deletePlanMutation.isPending}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {plans.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="font-bold">No plans configured</span>
                                            <span className="text-xs">Create one to allow members to subscribe.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* --- Slide-Over Sidebar UI --- */}

            {/* Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Panel */}
            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
                isSidebarOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
                    <h3 className="text-sm font-bold tracking-tight uppercase text-foreground">
                        {formData.id ? "Edit Plan Details" : "Create New Plan"}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan Name</Label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-card border-border h-11 text-sm font-medium rounded-md"
                            placeholder="e.g. Premium Access"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Price (LKR)</Label>
                        <Input
                            type="number"
                            value={formData.monthlyPrice}
                            onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                            className="bg-card border-border h-11 text-sm font-mono rounded-md"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Session Tokens</Label>
                        <Input
                            type="number"
                            value={formData.sessionTokens}
                            onChange={(e) => setFormData({ ...formData, sessionTokens: e.target.value })}
                            className="bg-card border-border h-11 text-sm font-mono rounded-md"
                            placeholder="e.g. 12"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Tokens dictate how many classes or resources a member can book per billing cycle.
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-card flex justify-end gap-3 mt-auto">
                    <Button variant="ghost" onClick={() => setIsSidebarOpen(false)} className="text-xs font-bold">
                        Cancel
                    </Button>
                    <Button
                        disabled={savePlanMutation.isPending}
                        onClick={handleFormSubmit}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs gap-1.5 shadow-md"
                    >
                        {savePlanMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {formData.id ? "Update Plan" : "Publish Plan"}
                    </Button>
                </div>
            </div>

        </div>
    );
}