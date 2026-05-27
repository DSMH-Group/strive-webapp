// app/tenants/[subdomain]/(admin)/settings/MembershipPlans.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { striveClientFetch } from "@/lib/api";
import {SaveButton, SectionHeader} from "@/app/tenants/[subdomain]/(admin)/settings/settingsClient";

interface MembershipPlansProps {
    tenantId: string;
    onComplete: () => void;
}

export function MembershipPlans({ tenantId, onComplete }: MembershipPlansProps) {
    const queryClient = useQueryClient();
    const [localPlans, setLocalPlans] = useState<any[]>([]);

    const { data: fetchedPlans = [], isLoading: plansLoading } = useQuery({
        queryKey: ["tenantPlans", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/plans?includeInactive=true", {
                headers: { "X-Tenant-ID": tenantId }
            });
            if (!res.ok) throw new Error("Failed to fetch plans");
            return res.json();
        }
    });

    useEffect(() => {
        if (fetchedPlans) {
            setLocalPlans(fetchedPlans.map((p: any) => ({ ...p, isDirty: false })));
        }
    }, [fetchedPlans]);

    const savePlansMutation = useMutation({
        mutationFn: async (plansToProcess: any[]) => {
            const headers = { "X-Tenant-ID": tenantId, "Content-Type": "application/json" };

            const promises = plansToProcess.map(plan => {
                if (plan.isDeleted) {
                    if (!plan.isNew) {
                        return striveClientFetch(`/api/v1/plans/${plan.id}`, { method: 'DELETE', headers });
                    }
                    return Promise.resolve();
                }

                if (plan.isNew) {
                    return striveClientFetch(`/api/v1/plans`, {
                        method: 'POST',
                        body: JSON.stringify({
                            name: plan.name,
                            monthlyPrice: Number(plan.monthlyPrice),
                            sessionTokens: Number(plan.sessionTokens)
                        }),
                        headers
                    });
                }

                if (plan.isDirty) {
                    return striveClientFetch(`/api/v1/plans/${plan.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            name: plan.name,
                            monthlyPrice: Number(plan.monthlyPrice),
                            sessionTokens: Number(plan.sessionTokens)
                        }),
                        headers
                    });
                }

                return Promise.resolve();
            });

            await Promise.all(promises);
        },
        onSuccess: () => {
            toast.success("Membership plans synchronized with Strive Core.");
            queryClient.invalidateQueries({ queryKey: ["tenantPlans", tenantId] });
            onComplete();
        },
        onError: (err: any) => toast.error(`Failed to save plans: ${err.message}`)
    });

    const handleAddPlan = () => {
        setLocalPlans([
            ...localPlans,
            { id: `temp-${Date.now()}`, name: "New Plan", monthlyPrice: 0, sessionTokens: 0, isNew: true }
        ]);
    };

    const updateLocalPlan = (id: string, field: string, value: any) => {
        setLocalPlans(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value, isDirty: true } : p
        ));
    };

    const handleSavePlans = () => {
        savePlansMutation.mutate(localPlans);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <SectionHeader title="Membership Plans" desc="Pricing and session token allocation per plan" />
                <Button
                    onClick={handleAddPlan}
                    variant="outline"
                    className="h-9 gap-1.5 text-xs font-bold border-border bg-background"
                >
                    <Plus className="w-3.5 h-3.5 text-primary" /> Add Plan
                </Button>
            </div>

            <Card className="bg-card/30 border-border rounded-lg p-6">
                {plansLoading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="hover:bg-transparent border-b border-border">
                            <TableRow className="border-b border-border hover:bg-transparent">
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider pl-0 w-1/3">
                                    PLAN NAME
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider">
                                    PRICE (LKR)
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider">
                                    TOKENS
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground font-bold tracking-wider text-right pr-0">
                                    ACTION
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {localPlans.filter(p => !p.isDeleted).map((plan) => (
                                <TableRow key={plan.id} className="border-b border-border hover:bg-transparent group">
                                    <TableCell className="pl-0 py-3">
                                        <Input
                                            type="text"
                                            value={plan.name}
                                            onChange={(e) => updateLocalPlan(plan.id, 'name', e.target.value)}
                                            className="w-full bg-background border-border font-bold h-9 text-sm rounded-sm"
                                            placeholder="e.g. Standard"
                                        />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Input
                                            type="number"
                                            value={plan.monthlyPrice}
                                            onChange={(e) => updateLocalPlan(plan.id, 'monthlyPrice', Number(e.target.value))}
                                            className="w-32 bg-background border-border font-mono h-9 text-sm rounded-sm"
                                        />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Input
                                            type="number"
                                            value={plan.sessionTokens}
                                            onChange={(e) => updateLocalPlan(plan.id, 'sessionTokens', Number(e.target.value))}
                                            className="w-24 bg-background border-border font-mono h-9 text-sm rounded-sm"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right pr-0 py-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => updateLocalPlan(plan.id, 'isDeleted', true)}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {localPlans.filter(p => !p.isDeleted).length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs italic">
                                        No plans configured. Create one to allow members to subscribe.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
                <SaveButton isLoading={savePlansMutation.isPending} onClick={handleSavePlans} />
            </Card>
        </div>
    );
}