// app/tenants/[subdomain]/trainer/clients/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TrainerClientsClient from "./clientsClient";

export default async function TrainerClientsPage({ params }: { params: Promise<{ subdomain: string }> }) {
    const { subdomain } = await params;
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://dsmhgroup.com/explore");
    }

    return (
        <TrainerClientsClient
            subdomain={subdomain}
            tenantId={tenantId}
        />
    );
}