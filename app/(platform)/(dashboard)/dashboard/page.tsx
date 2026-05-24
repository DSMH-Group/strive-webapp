// app/(platform)/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import GlobalDashboardClient from "./dashboardClient";

export const metadata = {
    title: "Dashboard | Strive Platform",
    description: "Live track your active athlete passports, streaks, and fitness milestones.",
};

export default async function GlobalDashboardPage() {
    // 1. Validate standard Next.js session context on server thread
    const authData = await auth.api.getSession({ headers: await headers() });
    if (!authData) redirect("/login");

    return (
        <GlobalDashboardClient
            initialUser={{
                name: authData.user.name || "Athlete",
                email: authData.user.email
            }}
        />
    );
}