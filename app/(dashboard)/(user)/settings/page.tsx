import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SettingsDashboardClient from "./settingsClient";

export default async function SettingsDashboardPage() {
    // 1. Authenticate standard Next.js cookie session
    const authData = await auth.api.getSession({ headers: await headers() });
    if (!authData) redirect("/login");

    // 2. Fetch the Keycloak cryptographic JWT from the OAuth subsystem
    const tokenResult = await auth.api.getAccessToken({
        headers: await headers(),
        body: {
            providerId: "keycloak", // Scopes lookups to Keycloak identity link records
        }
    });

    const keycloakAccessToken = tokenResult?.accessToken;

    if (!keycloakAccessToken) {
        // If the IDP token has expired or is unlinked, force re-authentication
        redirect("/login?error=missing_identity_token");
    }

    return (
        <SettingsDashboardClient
            initialToken={keycloakAccessToken} // The true Keycloak JWT passes cleanly!
            globalUser={authData.user}
        />
    );
}