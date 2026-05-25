// app/tenants/[subdomain]/member/dashboard/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboardClient";

export default async function MemberDashboardPage({
                                                      params,
                                                  }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Enforce data isolation scope boundaries
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://dsmhgroup.com/explore");
    }

    return (
        <DashboardClient
            subdomain={subdomain}
            tenantId={tenantId}
        />
    );
}