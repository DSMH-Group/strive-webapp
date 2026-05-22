// app/tenants/[subdomain]/(admin)/members/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MembersClient from "./membersClient";

// Ensure structural interface definitions match the Strive Core Engine API models
interface StrideMemberResponse {
    id: string;
    status: "PENDING" | "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED" | "CANCELLED" | "REVOKED";
    rfidTag: string | null;
    user: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    // Maps to PostgreSQL JSONB data fields (SRS Section 4.5)
    metadata?: {
        goal?: string;
        tokens?: number;
    };
    lastSession?: string;
    trainer?: string;
    plan?: string;
}

/**
 * Server-to-Server safe communications utility mapping to the NestJS modular monolith
 */
async function fetchTenantMembers(jwtToken: string, tenantId: string): Promise<StrideMemberResponse[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        const res = await fetch(`${baseUrl}/api/v1/members`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            // Low cache duration for live roster views on high-concurrency client desks
            next: { revalidate: 15 },
        });

        if (!res.ok) {
            console.error(`NestJS API returned structural error: ${res.status}`);
            return [];
        }

        return await res.json();
    } catch (error) {
        console.error("Critical failure during Stride Core Engine member fetch:", error);
        return [];
    }
}

export default async function MembersPage({
                                              params,
                                          }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // 1. Extract multi-tenant edge proxy headers (SRS Section 2.2)
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        // Safe structural fallback to cluster discovery if multi-tenant payload parsing missing
        redirect("https://strive.lk/explore");
    }

    // 2. Session extraction via better-auth or custom JWT verification logic
    // (Uncomment this block once your authentication middleware layers are active)
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");

    const bearerToken = authData.session.token;
    const initialMembers = await fetchTenantMembers(bearerToken, tenantId);
    */

    // Temporary layout tracking variable for local data compilation testing
    const initialMembers: StrideMemberResponse[] = [];

    return (
        <MembersClient
            subdomain={subdomain}
            initialMembers={initialMembers}
        />
    );
}