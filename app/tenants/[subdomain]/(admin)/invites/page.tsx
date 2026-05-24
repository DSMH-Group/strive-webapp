// app/tenants/[subdomain]/(admin)/members/invites/page.tsx
import React from "react";
import { headers } from "next/headers";
import InvitesClient from "./invitesClient";

export default async function InvitesPage({ params }: { params: Promise<{ subdomain: string }> }) {
    const { subdomain } = await params;
    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id") || "";

    return (
        <InvitesClient
            subdomain={subdomain}
            tenantId={tenantId}
        />
    );
}