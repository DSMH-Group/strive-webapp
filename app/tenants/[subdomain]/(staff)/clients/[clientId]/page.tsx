// app/tenants/[subdomain]/(admin)/trainer/clients/[clientId]/page.tsx
import { headers } from "next/headers";
import ClientDetailClient from "./pageClient";

export default async function ClientDetailPage({ params }: { params: Promise<{ subdomain: string, clientId: string }> }) {
    const { clientId } = await params;
    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id") || "";

    return <ClientDetailClient tenantId={tenantId} clientId={clientId} />;
}