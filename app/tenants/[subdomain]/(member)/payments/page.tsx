// app/tenants/[subdomain]/member/payments/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PaymentsClient from "./paymentsClient";

interface StrideScopedInvoiceResponse {
    id: string;
    date: string;
    desc: string;
    amount: number;
    status: "PAID" | "UNPAID" | "OVERDUE";
}

/**
 * Server-to-server transaction query pipeline isolated explicitly to target tenant identifiers
 */
async function fetchTenantScopedInvoiceLedger(jwtToken: string, tenantId: string): Promise<StrideScopedInvoiceResponse[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Target query fetches invoices that are automatically isolated by the database tenancy layer
        const res = await fetch(`${baseUrl}/api/v1/billing/invoices?membershipId=me`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 30 }, // 30-second low cache boundary for live checkout tracking
        });

        if (!res.ok) return [];
        const rawInvoices = await res.json();

        // Standardized data mapper
        return rawInvoices.map((inv: any) => ({
            id: inv.id,
            date: new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            desc: inv.lineItems?.[0]?.description || "Facility Membership Settlement",
            amount: inv.amount,
            status: inv.status
        }));
    } catch (error) {
        console.error("Critical error during tenant invoice ledger fetch mapping loops:", error);
        return [];
    }
}

export default async function MemberPaymentsPage({
                                                     params,
                                                 }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Secure multi-tenant parsing validated by edge path proxy rewrites (SRS Section 2.1)
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://dsmhgroup.com/explore");
    }

    // Server-side authentication checks
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");
    const initialTenantInvoices = await fetchTenantScopedInvoiceLedger(authData.session.token, tenantId);
    */

    const initialTenantInvoices: StrideScopedInvoiceResponse[] = [];

    return (
        <PaymentsClient
            subdomain={subdomain}
            tenantName={subdomain}
            initialTenantInvoices={initialTenantInvoices}
        />
    );
}