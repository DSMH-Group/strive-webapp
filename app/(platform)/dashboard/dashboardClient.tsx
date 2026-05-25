// app/(platform)/(dashboard)/dashboard/dashboardClient.tsx
"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { striveClientFetch } from "@/lib/api";
import {GlobalUserDto} from "@/db/types";
import {NoContextDashboard} from "@/components/platform/dashboard/no-context-dashboard";
import {WorkspaceGrid} from "@/components/platform/dashboard/workspace-grid";
import {AthleteMetrics} from "@/components/platform/dashboard/athlete-metrics";

interface Props {
    initialUser: { id: string; name: string; email: string };
}

export default function GlobalDashboardClient({ initialUser }: Props) {
    // Fetch the unified identity + ALL memberships
    const { data: userProfile, isLoading, isError } = useQuery<GlobalUserDto>({
        queryKey: ["globalProfile", initialUser.id],
        queryFn: async () => {
            // Change this line back to the standard /me endpoint!
            const res = await striveClientFetch("/api/v1/users/me", { method: "GET" });
            if (!res.ok) throw new Error("Could not fetch user profile and workspaces.");
            return res.json();
        }
    });

    // Derive user states
    const memberships = userProfile?.memberships || [];
    const hasAnyRole = memberships.length > 0;

    // Find the first gym where they are a MEMBER to fetch their primary athletic stats
    const primaryMemberTenantId = useMemo(() => {
        const memberGym = memberships.find(m => m.roles.some(r => r.role === "MEMBER"));
        return memberGym?.tenantId;
    }, [memberships]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-[10px] text-muted-foreground font-bold uppercase tracking-widest gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                Synchronizing Strive Ecosystem...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-8 text-center max-w-md mx-auto space-y-3">
                <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Ecosystem handshake failed.</p>
            </div>
        );
    }

    // SCENARIO 1: Brand new user. No gyms, no roles.
    if (!hasAnyRole) {
        return <NoContextDashboard initialUser={initialUser} hideOnboardingBanner={false} />;
    }

    // SCENARIO 2: Active User (Staff, Admin, or Member across 1 or more gyms)
    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                    Welcome back, {initialUser.name.split(' ')[0]}
                </h1>
            </div>

            {/* Workspaces / Gyms they belong to */}
            <WorkspaceGrid memberships={memberships} />

            {/* Athletic Stats (Real if they are a member somewhere, Blurred skeleton if they are just staff) */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold italic uppercase tracking-tighter border-b border-border pb-2 text-foreground">
                    Athlete Passport
                </h3>
                {primaryMemberTenantId ? (
                    <AthleteMetrics tenantId={primaryMemberTenantId} />
                ) : (
                    <NoContextDashboard initialUser={initialUser} hideOnboardingBanner={true} isSubSection={true} />
                )}
            </div>
        </div>
    );
}