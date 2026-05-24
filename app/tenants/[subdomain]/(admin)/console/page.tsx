// app/tenants/[subdomain]/(admin)/console/page.tsx
import ConsoleClient from "./consoleClient";

interface ConsolePageProps {
    params: Promise<{ subdomain: string }>;
}

export default async function ConsolePage({ params }: ConsolePageProps) {
    const { subdomain } = await params;

    return (
        <ConsoleClient subdomain={subdomain} />
    );
}