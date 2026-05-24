// app/tenants/[subdomain]/member/activities/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ActivitiesClient from "./activitiesClient";

interface StrideActivityJSONBStructure {
    programName: string;
    scheduleContext: string;
    completionPercentage: number;
    exercises: Record<string, any[]>;
}

/**
 * Server-to-server data fetch infrastructure capturing exercise payloads out of user JSONB blobs
 */
async function fetchUserScopedActivityMatrix(jwtToken: string, tenantId: string): Promise<StrideActivityJSONBStructure | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Dynamic queries sourcing custom vertical context arrays (SRS Section 4.5 PostgreSQL JSONB)
        const res = await fetch(`${baseUrl}/api/v1/members/me`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 30 }, // Simple short caching bounds to capture live updates
        });

        if (!res.ok) return null;
        const completeProfile = await res.json();

        // Emits target metadata parsing structures
        return completeProfile?.metadata?.activities || null;
    } catch (error) {
        console.error("Critical failure during Stride Core Engine activity JSONB lookup:", error);
        return null;
    }
}

export default async function MemberActivitiesPage({
                                                       params,
                                                   }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Enforce clear tenant isolation contexts across multi-tenant edge parameters
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://dsmhgroup.com/explore");
    }

    // Server-side active identity checks
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");
    const initialActivitiesData = await fetchUserScopedActivityMatrix(authData.session.token, tenantId);
    */

    const initialActivitiesData = null;

    return (
        <ActivitiesClient
            subdomain={subdomain}
            initialActivitiesData={initialActivitiesData}
        />
    );
}