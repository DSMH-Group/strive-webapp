// app/tenants/[subdomain]/member/dashboard/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboardClient";

interface StrideMemberMetricsResponse {
    firstName: string;
    lastName: string;
    plan: string;
    expires: string;
    tokensLeft: number;
    streak: number;
    sessionsThisMonth: number;
    prsThisMonth: number;
    avgPerWeek: number;
    todaySession: any;
    nextSession: any;
    weeklyHistory: any[];
}

/**
 * Server-to-server data fetch utility mapping metrics directly from NestJS PostgreSQL modules
 */
async function fetchUserDashboardMetrics(jwtToken: string, tenantId: string): Promise<StrideMemberMetricsResponse | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Dynamic metadata extraction queries (SRS Backend Section 4.5 PostgreSQL JSONB schemas)
        const res = await fetch(`${baseUrl}/api/v1/members/me`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 30 }, // Cache parameter threshold safe for live check-in telemetry updates
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed server gathering of user dashboard metrics data structures:", error);
        return null;
    }
}

export default async function MemberDashboardPage({
                                                      params,
                                                  }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Enforce data isolation scope boundaries via proxy parsing rules
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://dsmhgroup.com/explore");
    }

    // Server-side active session check placeholders
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");
    const memberData = await fetchUserDashboardMetrics(authData.session.token, tenantId);
    */

    const memberData = null;

    return (
        <DashboardClient
            subdomain={subdomain}
            memberData={memberData}
        />
    );
}