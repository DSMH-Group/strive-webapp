// app/tenants/[subdomain]/member/payments/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PaymentsClient from "./paymentsClient";

export default async function MemberPaymentsPage({
                                                     params,
                                                 }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Secure multi-tenant parsing validated by edge path proxy rewrites
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://dsmhgroup.com/explore");
    }

    return (
        <PaymentsClient
            subdomain={subdomain}
            tenantId={tenantId}
        />
    );
}