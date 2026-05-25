// app/tenants/[subdomain]/[admin]/settings/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SettingsClient from "./settingsClient";

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
        redirect("https://dsmhgroup.com/explore");
    }

    return (
        <SettingsClient
            subdomain={subdomain}
            tenantId={tenantId}
        />
    );
}