// app/provision/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProvisionTenantClient from "./provisionClient";

export const metadata = {
    title: "Gym Onboarding | Stride",
    description: "Provision a new decoupled gym workspace environment.",
};

export default async function ProvisionTenantPage() {
    // 1. Resolve standard Next.js cookie session
    const sessionResponse = await auth.api.getSession({ headers: await headers() });
    if (!sessionResponse) redirect("/login");

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/v1/users/me`;

    // 2. Fetch profile from NestJS using the native session token
    const userRes = await fetch(backendUrl, {
        headers: {
            "Authorization": `Bearer ${sessionResponse.session.id}`,
            "Content-Type": "application/json"
        }
    });

    if (!userRes.ok) {
        console.error(`[Provision Onboarding] Profile sync failed. Status: ${userRes.status}`);
        redirect("/login?error=profile_fetch_failed");
    }

    const backendUser = await userRes.json();

    return (
        <div className="container max-w-4xl py-10">
            <div className="space-y-2 text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight uppercase">Gym Onboarding</h1>
                <p className="text-sm text-zinc-400">Initialize your isolated business workspace profile parameters.</p>
            </div>
            {/* Pass only the internal user ID resolved straight from your core backend engine */}
            <ProvisionTenantClient ownerId={backendUser.id} />
        </div>
    );
}