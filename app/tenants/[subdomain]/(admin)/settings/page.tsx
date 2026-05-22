// app/tenants/[subdomain]/[admin]/settings/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SettingsClient from "./settingsClient";

/**
 * Server-to-server settings data parser syncing core brand configs
 */
async function fetchTenantProfileSettings(jwtToken: string, tenantId: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        const res = await fetch(`${baseUrl}/api/v1/tenants/${tenantId}`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
            },
            next: { revalidate: 120 } // Cache configurations safely for 2 minutes
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Critical failure requesting tenant configuration schema:", error);
        return null;
    }
}

export default async function SettingsPage({
                                               params,
                                           }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Secure multi-tenant scoping via proxy header injection validation
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://strive.lk/explore");
    }

    // Server session token parsing frameworks
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");
    const tenantConfig = await fetchTenantProfileSettings(authData.session.token, tenantId);
    */

    const tenantConfig = null;

    return (
        <SettingsClient
            subdomain={subdomain}
            tenantConfig={tenantConfig}
        />
    );
}