// app/tenants/[subdomain]/trainer/schedule/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ScheduleClient from "./scheduleClient";

interface StrideBookingResponse {
    id: string;
    resourceId: string;
    membershipId: string;
    startTime: string;
    endTime: string;
    metadata?: any;
}

/**
 * Server-to-server data fetch utility mapping directly to the NestJS Scheduling Engine
 */
async function fetchTrainerScheduleTimeline(jwtToken: string, tenantId: string): Promise<StrideBookingResponse[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

        // Pulls scheduling entries mapped to the active context header boundary
        const res = await fetch(`${baseUrl}/api/v1/scheduling/bookings`, {
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "X-Tenant-ID": tenantId,
                "Content-Type": "application/json",
            },
            next: { revalidate: 20 }, // 20-second low cache parameter to monitor schedule changes
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed structural gathering of scheduling timeline data sets:", error);
        return [];
    }
}

export default async function TrainerSchedulePage({
                                                      params,
                                                  }: {
    params: Promise<{ subdomain: string }>;
}) {
    const { subdomain } = await params;

    // Enforce data isolation limits via proxy parsing (SRS Section 2.1)
    const requestHeaders = await headers();
    const tenantId = requestHeaders.get("x-tenant-id");

    if (!tenantId) {
        redirect("https://dsmhgroup.com/explore");
    }

    // Server-side session authentication wrappers
    /*
    const authData = await auth.api.getSession({ headers: requestHeaders });
    if (!authData) redirect("/login");
    const initialBookings = await fetchTrainerScheduleTimeline(authData.session.token, tenantId);
    */

    const initialBookings: StrideBookingResponse[] = [];

    return (
        <ScheduleClient
            subdomain={subdomain}
            tenantId={tenantId}
            initialBookings={initialBookings}
        />
    );
}