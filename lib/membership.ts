// src/lib/membership.ts
import {striveClientFetch} from "@/lib/api";

export async function getMembershipRole(tenantId: string) {
    try {
        // Call your existing API endpoint
        const response = await striveClientFetch(`/api/v1/members/me`, {
            tenantId,
            method: 'GET',
        });

        if (!response.ok) return 'MEMBER'; // Default to lowest role on error

        const data = await response.json();

        // Extract roles from the membership object returned by your API
        // Assuming the API returns: { roles: [{ role: 'ORG_ADMIN' }, ...] }
        const roles = data.roles?.map((r: any) => r.role) || [];

        if (roles.includes('ORG_ADMIN')) return 'ADMIN';
        if (roles.includes('MANAGER') || roles.includes('TRAINER')) return 'STAFF';
        return 'MEMBER';
    } catch (error) {
        console.error("Failed to fetch membership role:", error);
        return 'MEMBER';
    }
}