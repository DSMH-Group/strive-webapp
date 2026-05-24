import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DiscoverGymsClient from "./discoverClient";

export const metadata = {
    title: "Discover Facilities | Strive Platform",
    description: "Explore and search all partner spaces inside the Strive ecosystem.",
};

export default async function DiscoverGymsPage() {
    // 1. Authenticate session context on the server edge boundary
    const authData = await auth.api.getSession({ headers: await headers() });
    if (!authData) redirect("/login");

    const { session, user } = authData;

    // 2. Safely handoff initial system footprints to the client layer
    return (
        <DiscoverGymsClient
            initialToken={session.token}
            globalUser={user}
        />
    );
}