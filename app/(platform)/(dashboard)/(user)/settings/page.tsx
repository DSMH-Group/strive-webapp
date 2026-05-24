// app/(platform)/(dashboard)/(user)/settings/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SettingsDashboardClient from "./settingsClient";

export const metadata = {
    title: "Profile Settings | Stride",
    description: "Modify your global master identity data parameters.",
};

export default async function SettingsDashboardPage() {
    // 1. Resolve standard Next.js cookie session context
    const authData = await auth.api.getSession({ headers: await headers() });
    if (!authData) redirect("/login");

    return (
        <SettingsDashboardClient
            // 2. Pass the native session ID string as your authorization bearer token
            initialToken={authData.session.id}
            globalUser={authData.user}
        />
    );
}