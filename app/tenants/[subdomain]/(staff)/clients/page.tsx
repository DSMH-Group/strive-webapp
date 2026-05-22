// app/tenants/[subdomain]/trainer/clients/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TrainerClientsClient from "./clientsClient";

interface StrideClientResponse {
    id: string;
    status: "PENDING" | "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED" | "CANCELLED" | "REVOKED";
    plan: string;
    goal: string;
    lastSession: string;
    tokens: number;
    trainer: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

/**
 * Server-to-server fetch layer mapping directly to the NestJS Core Engine
 */
async function fetchTrainerAssignedRoster(jwtToken: string, tenantId: string): Promise<StrideClientResponse[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Requests user records scoped precisely to the active tenant_id context
        const res = await fetch(`${baseUrl}/api/v1/members?role=MEMBER`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 10 }, // 10-second cache threshold for rapid ingress coordination
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failure processing staff roster retrieval payload queries:", error);
        return [];
    }
}

export default async function TrainerClientsPage({
                                                     params,
                                                 }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Enforce data isolation via proxy context extraction (SRS Section 2.1)
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://strive.lk/explore");
    }

    // Server-side session extraction architecture placeholders
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");

    // Protection fallback: Kick profiles out if they do not hold TRAINER roles
    const initialClients = await fetchTrainerAssignedRoster(authData.session.token, tenantId);
    */

    const initialClients: StrideClientResponse[] = [];

    return (
        <TrainerClientsClient
            subdomain={subdomain}
            initialClients={initialClients}
        />
    );
}