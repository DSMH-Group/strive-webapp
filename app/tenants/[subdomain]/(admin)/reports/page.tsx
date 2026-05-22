// app/tenants/[subdomain]/(admin)/reports/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ReportsClient from "./reportsClient";

/**
 * Server-to-server operations collector reading core metric payloads from the backend
 */
async function fetchOperationalMetrics(jwtToken: string, tenantId: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Parallelized payload queries matching standard ledger collection paradigms
        const [invoiceRes, attendanceRes] = await Promise.all([
            fetch(`${baseUrl}/api/v1/billing/invoices`, {
                headers: { "Authorization": `Bearer ${jwtToken}`, "X-Tenant-ID": tenantId },
                next: { revalidate: 30 }
            }),
            fetch(`${baseUrl}/api/v1/attendances`, {
                headers: { "Authorization": `Bearer ${jwtToken}`, "X-Tenant-ID": tenantId },
                next: { revalidate: 60 }
            })
        ]);

        const invoices = invoiceRes.ok ? await invoiceRes.json() : [];
        const attendanceData = attendanceRes.ok ? await attendanceRes.json() : { history: [] };

        return {
            financials: { invoices, pendingTransfers: [] },
            utilization: { history: attendanceData.history }
        };
    } catch (error) {
        console.error("Failed executing operational metrics queries:", error);
        return { financials: { invoices: [], pendingTransfers: [] }, utilization: { history: [] } };
    }
}

export default async function ReportsPage({
                                              params,
                                          }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Extract tenant identification data securely from edge middleware routing keys
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://strive.lk/explore");
    }

    // Server-side session validation framework placeholders
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");
    const token = authData.session.token;
    const data = await fetchOperationalMetrics(token, tenantId);
    */

    const data = { financials: null, utilization: null };

    return (
        <ReportsClient
            subdomain={subdomain}
            financials={data.financials}
            utilization={data.utilization}
        />
    );
}