// src/lib/membership.ts
import { headers } from "next/headers";

export async function getMembershipRole(tenantId: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://strive-core-development.up.railway.app";
        const reqHeaders = await headers();

        // 🚀 SERVER-SAFE FETCH: Explicitly forward cookie jars and tenant IDs
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

        const data = await response.json();
        const roles = data.roles?.map((r: any) => r.role) || [];

        if (roles.includes('ORG_ADMIN')) return 'ADMIN';
        if (roles.includes('MANAGER') || roles.includes('TRAINER')) return 'STAFF';
        return 'MEMBER';
    } catch (error) {
        console.error("Failed to fetch membership role on server:", error);
        return 'MEMBER';
    }
}