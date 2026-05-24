"use client";

import React from "react";
import {useQuery} from "@tanstack/react-query";
import {striveClientFetch} from "@/lib/api";
import {TenantAdminSidebar} from "@/components/tenant/admin/TenantAdminSidebar";
import {TenantStaffSidebar} from "@/components/tenant/staff/TenantStaffSidebar";
import {TenantMemberSidebar} from "@/components/tenant/member/TenantMemberSidebar";
import {Loader2} from "lucide-react";

interface SidebarManagerProps {
    tenantId: string;
    config: any;
}

export function TenantSidebarManager({tenantId, config}: SidebarManagerProps) {
    // 🚀 Leverage the working client-side fetch pattern!
    const {data: userProfile, isLoading} = useQuery({
        queryKey: ["sidebarProfileHandshake", tenantId],
        queryFn: async () => {
            const res = await striveClientFetch("/api/v1/users/me", {method: "GET"});
            if (!res.ok) throw new Error("Failed to fetch sidebar profile profile context");
            return res.json();
        }
    });

    const tenantName = config?.name || "Workspace";
    const logoUrl = config?.themeConfig?.logoUrl;

    // 1. While loading the profile array from the client cache, show a subtle skeleton state
    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-6 bg-background">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60"/>
            </div>
        );
    }

    // 2. Isolate the membership block exactly like your console page does
    const activeMembership = userProfile?.memberships?.find(
        (m: any) => m.tenantId === tenantId || m.tenant?.id === tenantId
    );

    const roles = activeMembership?.roles?.map((r: any) => r.role) || [];

    // 3. Conditional RBAC render routing block
    if (roles.includes("ORG_ADMIN")) {
        return <TenantAdminSidebar tenantName={tenantName} logoUrl={logoUrl}/>;
    }

    if (roles.includes("MANAGER") || roles.includes("TRAINER")) {
        return <TenantStaffSidebar tenantName={tenantName} logoUrl={logoUrl}/>;
    }

    return <TenantMemberSidebar tenantName={tenantName} logoUrl={logoUrl}/>;
}