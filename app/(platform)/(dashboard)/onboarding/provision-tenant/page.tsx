import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import ProvisionTenantClient from "./provisionClient";
import {account} from "@/db/schema";
import { eq } from "drizzle-orm";
import {db} from "@/db/db";

export default async function ProvisionTenantPage() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) redirect("/login");

    const userAccount = await db.query.account.findFirst({
        where: eq(account.userId, session.user.id)
    });

    // 1. LOG THE DB STATE
    console.log("--- DEBUG: DB Account State ---");
    console.log("User ID:", session.user.id);
    console.log("Access Token Exists:", !!userAccount?.accessToken);
    if (userAccount?.accessToken) {
        console.log("Token Preview:", userAccount.accessToken);
    }

    if (!userAccount?.accessToken) {
        console.error("Critical: No access token found for user.");
        redirect("/login");
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/me`;
    console.log("--- DEBUG: Fetching Backend ---");
    console.log("URL:", backendUrl);

    const userRes = await fetch(backendUrl, {
        headers: {
            "Authorization": `Bearer ${userAccount.accessToken}`,
            "X-Keycloak-Sub": session.user.id, // Add this specific header
            "Content-Type": "application/json"
        }
    });

    if (!userRes.ok) {
        // 2. LOG THE EXACT BACKEND ERROR
        const errorText = await userRes.text();
        console.error("--- DEBUG: Backend Auth Failure ---");
        console.error("Status:", userRes.status);
        console.error("Error Response:", errorText);

        redirect("/login?error=profile_fetch_failed");
    }

    const user = await userRes.json();
    console.log("--- DEBUG: Profile Success ---");
    console.log("User Data:", user);

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8">Gym Onboarding</h1>
            <ProvisionTenantClient ownerId={user.id}/>
        </div>
    );
}