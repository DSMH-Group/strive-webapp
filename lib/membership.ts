// src/lib/membership.ts
import { headers } from "next/headers";

export async function getMembershipRole(tenantId: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://strive-core-development.up.railway.app";
        const reqHeaders = await headers();

        const response = await fetch(`${baseUrl}/api/v1/members/me`, {
            method: 'GET',
            headers: {
                "Cookie": reqHeaders.get("cookie") || "",
                "X-Tenant-ID": tenantId
            }
        });

        if (!response.ok) {
            console.error(`[Membership Server Hook] Backend rejected lookup: ${response.status}`);
            return 'MEMBER';
        }

        const userProfile = await response.json();

        // 🚀 FIX: Isolate the correct membership block matching this active tenant context
        const activeMembership = userProfile.memberships?.find(
            (m: any) => m.tenantId === tenantId || m.tenant?.id === tenantId
        );

        if (!activeMembership) {
            console.warn(`[Membership Server Hook] No matching membership block found for tenantId: ${tenantId}`);
            return 'MEMBER';
        }

        // Extract the nested role strings out of the matched object block cleanly!
        const roles = activeMembership.roles?.map((r: any) => r.role) || [];

        console.log(`[Membership Server Hook] Resolved active user roles:`, roles);

        if (roles.includes('ORG_ADMIN')) return 'ADMIN';
        if (roles.includes('MANAGER') || roles.includes('TRAINER')) return 'STAFF';

        return 'MEMBER';
    } catch (error) {
        console.error("Failed to fetch membership role on server:", error);
        return 'MEMBER';
    }
}