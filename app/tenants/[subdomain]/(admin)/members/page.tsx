// app/tenants/[subdomain]/(admin)/members/page.tsx
import React from "react";
import { headers } from "next/headers";
import MembersClient from "./membersClient";

export default async function MembersPage({ params }: { params: Promise<{ subdomain: string }> }) {
    const { subdomain } = await params;
    const reqHeaders = await headers();
    const tenantId = reqHeaders.get("x-tenant-id") || "";

    return (
        <MembersClient
            subdomain={subdomain}
            tenantId={tenantId}
        />
    );
}