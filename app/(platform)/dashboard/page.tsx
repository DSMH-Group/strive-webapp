// app/(platform)/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import GlobalDashboardClient from "./dashboardClient";

export const metadata = {
    title: "Global Hub | Strive Platform",
    description: "Manage your workspaces, track athlete passports, and monitor fitness milestones.",
};

export default async function GlobalDashboardPage() {
    // Standard Next.js server-side auth validation
    const authData = await auth.api.getSession({ headers: await headers() });
    if (!authData) redirect("/login");

    return (
        <GlobalDashboardClient
            initialUser={{
                id: authData.user.id,
                name: authData.user.name || "Athlete",
                email: authData.user.email
            }}
        />
    );
}