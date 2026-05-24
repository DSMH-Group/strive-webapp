// app/tenants/[subdomain]/trainer/log/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LogClient from "./logClient";

interface StrideMinimalUserRoster {
    id: string;
    name: string;
}

/**
 * Server-to-server endpoint interface syncing client lists directly from NestJS modules
 */
async function fetchTrainerAssignedIdentityRoster(jwtToken: string, tenantId: string): Promise<StrideMinimalUserRoster[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        const res = await fetch(`${baseUrl}/api/v1/members?role=MEMBER`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 60 }, // Long cache window since name rosters alter infrequently
        });

        if (!res.ok) return [];
        const rawMembers = await res.json();

        return rawMembers.map((m: any) => ({
            id: m.id,
            name: `${m.user?.firstName || "Strive"} ${m.user?.lastName || "Member"}`
        }));
    } catch (error) {
        console.error("Failed server gathering of active member list schemas:", error);
        return [];
    }
}

export default async function TrainerLogPage({
                                                 params,
                                             }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Secure context scoping extraction parameters (SRS Multi-Tenancy Section 2.1)
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://dsmhgroup.com/explore");
    }

    // Server-side session extraction frameworks
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");
    const assignedClients = await fetchTrainerAssignedIdentityRoster(authData.session.token, tenantId);
    */

    const assignedClients: StrideMinimalUserRoster[] = [];

    return (
        <LogClient
            subdomain={subdomain}
            assignedClients={assignedClients}
        />
    );
}