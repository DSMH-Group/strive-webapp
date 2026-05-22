// app/tenants/[subdomain]/member/progress/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProgressClient from "./progressClient";

/**
 * Server-to-server lookup pipeline mapping directly into polymorphic user metadata blocks
 */
async function fetchUserMetricsPayload(jwtToken: string, tenantId: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Dynamic payload sourcing strategy out of PostgreSQL JSONB containers
        const res = await fetch(`${baseUrl}/api/v1/members/me`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 30 },
        });

        if (!res.ok) return null;
        const profile = await res.json();

        // Yields target polymorphic sub-matrix arrays
        return profile?.metadata?.progressMatrix || null;
    } catch (error) {
        console.error("Failed server gathering of target metric schemas:", error);
        return null;
    }
}

export default async function MemberProgressPage({
                                                     params,
                                                 }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Enforce data isolation limits via proxy header boundaries (SRS Architecture Section 2.1)
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://strive.lk/explore");
    }

    // Server-side authentication check frameworks
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");
    const progressData = await fetchUserMetricsPayload(authData.session.token, tenantId);
    */

    const progressData = null;

    return (
        <ProgressClient
            subdomain={subdomain}
            progressData={progressData}
        />
    );
}