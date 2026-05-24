"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { striveClientFetch } from "@/lib/api";
import { TenantAdminSidebar } from "@/components/tenant/admin/TenantAdminSidebar";
import { TenantStaffSidebar } from "@/components/tenant/staff/TenantStaffSidebar";
import { TenantMemberSidebar } from "@/components/tenant/member/TenantMemberSidebar";
import { Loader2 } from "lucide-react";

interface SidebarManagerProps {
    tenantId: string;
    config: any;
}

export function TenantSidebarManager({ tenantId, config }: SidebarManagerProps) {
    console.log(`[SidebarManager] [STEP 1] Initializing render loop. Active Props -> tenantId: "${tenantId}", configName: "${config?.name}"`);

    const { data: userProfile, isLoading, error } = useQuery({
        queryKey: ["sidebarProfileHandshake", tenantId],
        queryFn: async () => {
            console.log("[SidebarManager] [STEP 2-A] Query cache missed. Dispatching striveClientFetch to /api/v1/users/me...");
            try {
                const res = await striveClientFetch("/api/v1/users/me", { method: "GET" });

                console.log(`[SidebarManager] [STEP 2-B] Network response returned. Status: ${res.status} ${res.statusText}`);
                if (!res.ok) {
                    throw new Error(`HTTP Error Status: ${res.status}`);
                }

                const data = await res.json();
                console.log("[SidebarManager] [STEP 2-C] Payload parsed successfully from backend stream:", data);
                return data;
            } catch (err: any) {
                console.error("[SidebarManager] [CRITICAL] Exception caught inside fetching query function:", err.message || err);
                throw err;
            }
        }
    });

    const tenantName = config?.name || "Workspace";
    const logoUrl = config?.themeConfig?.logoUrl;

    if (isLoading) {
        console.log("[SidebarManager] [SATELLITE] useQuery status is 'isLoading' -> Rendering spinner skeleton state.");
        return (
            <div className="flex h-full w-full items-center justify-center p-6 bg-background">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60"/>
            </div>
        );
    }

    if (error) {
        console.error("[SidebarManager] [BREAKDOWN] useQuery flag reported an active error state:", error);
    }

    console.log("[SidebarManager] [STEP 3] Evaluating userProfile dataset structure:", {
        hasProfile: !!userProfile,
        userId: userProfile?.id,
        membershipsCount: userProfile?.memberships?.length || 0,
        rawMembershipsArray: userProfile?.memberships
    });

    // Isolate the membership block matching your routing configurations
    const activeMembership = userProfile?.memberships?.find((m: any) => {
        const matchesTenantIdField = m.tenantId === tenantId;
        const matchesNestedTenantIdField = m.tenant?.id === tenantId;

        console.log(` -> Testing membership item [ID: ${m.id}]:`, {
            itemTenantId: m.tenantId,
            itemNestedTenantId: m.tenant?.id,
            targetTenantId: tenantId,
            matchesTenantIdField,
            matchesNestedTenantIdField
        });

        return matchesTenantIdField || matchesNestedTenantIdField;
    });

    console.log("[SidebarManager] [STEP 4] Outcome of .find() operation for activeMembership:", activeMembership || "UNDEFINED (No Match Found)");

    const roles = activeMembership?.roles?.map((r: any) => r.role) || [];
    console.log(`[SidebarManager] [STEP 5] Parsed string array of structural roles:`, roles);

    // Conditional RBAC routing evaluation loops
    if (roles.includes("ORG_ADMIN")) {
        console.log(`[SidebarManager] [SUCCESS] Target criteria "ORG_ADMIN" matched. Rendering -> <TenantAdminSidebar tenantName="${tenantName}" />`);
        return <TenantAdminSidebar tenantName={tenantName} logoUrl={logoUrl}/>;
    }

    if (roles.includes("MANAGER") || roles.includes("TRAINER")) {
        console.log(`[SidebarManager] [SUCCESS] Staff footprint matched (${roles}). Rendering -> <TenantStaffSidebar tenantName="${tenantName}" />`);
        return <TenantStaffSidebar tenantName={tenantName} logoUrl={logoUrl}/>;
    }

    console.log(`[SidebarManager] [FALLBACK] No high-privilege conditions verified. Defaulting to lowest baseline role -> <TenantMemberSidebar tenantName="${tenantName}" />`);
    return <TenantMemberSidebar tenantName={tenantName} logoUrl={logoUrl}/>;
}