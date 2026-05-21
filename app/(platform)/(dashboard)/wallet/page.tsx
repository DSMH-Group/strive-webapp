import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import WalletDashboardClient from "./walletClient";

export const metadata = {
    title: "Billing & Subscriptions Ledger | Strive Platform",
    description: "Manage unified payment gateways, card vaults, and multi-tenant invoices.",
};

export default async function WalletDashboardPage() {
    const authData = await auth.api.getSession({ headers: await headers() });
    if (!authData) redirect("/login");

    const { session, user } = authData;

    return (
        <WalletDashboardClient
            initialToken={session.token}
            globalUser={user}
        />
    );
}