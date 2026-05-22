// app/tenants/[subdomain]/(admin)/console/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ConsoleClient from "./consoleClient";

// --- Interfaces matching the NestJS backend ---
interface MembershipResponse {
    status: string;
    initialRole: string;
    tenantName?: string;
}

// Helper to make secure server-to-server calls to the NestJS Monolith
async function fetchBackend<T>(endpoint: string, jwtToken: string, tenantId: string): Promise<T | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 30 }, // 30-second cache for admin data
        });

        if (!res.ok) return null;
        return await res.json() as T;
    } catch (error) {
        console.error(`Backend fetch error on ${endpoint}:`, error);
        return null;
    }
}

export default async function ConsolePage({
                                              params
                                          }: {
    params: Promise<{ subdomain: string }>
}) {
    const { subdomain } = await params;

    // 1. Authenticate user via better-auth
    // const headerList = await headers();
    // const authData = await auth.api.getSession({ headers: headerList });
    // if (!authData) redirect("/login");
    //
    // const { user, session } = authData;
    // const bearerToken = session.token;

    // // 2. Extract tenant ID securely injected by proxy.ts
    // const tenantId = headerList.get("x-tenant-id");
    // if (!tenantId) redirect("https://strive.lk/explore");
    //
    // // 3. Verify Membership & RBAC (Role-Based Access Control)
    // const membership = await fetchBackend<MembershipResponse>("/api/v1/members/me", bearerToken, tenantId);
    //
    // if (!membership || membership.status === "REVOKED") {
    //     redirect("/onboarding/link-gym");
    // }
    //
    // // Protect the admin route: Kick members out to their B2C dashboard
    // if (membership.initialRole !== "ORG_ADMIN" && membership.initialRole !== "MANAGER") {
    //     redirect(`/${subdomain}/dashboard`); // Assuming the member view is here
    // }

    // 4. Fetch Admin Data in Parallel

    const members: any[] = [];
    const invoices: any[] = [];
    const attendances = { history: [], monthlyCount: 0 };

    // 5. Pass data to the interactive Client Component
    return (
        <ConsoleClient
            subdomain={subdomain}
            tenantName={subdomain}
            members={members || []}
            invoices={invoices || []}
            attendances={attendances || { history: [], monthlyCount: 0 }}
        />
    );
}