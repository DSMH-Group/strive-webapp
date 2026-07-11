// app/tenants/[subdomain]/(admin)/front-desk/page.tsx
import FrontDeskClient from "./frontDeskClient";

interface FrontDeskPageProps {
    params: Promise<{ subdomain: string }>;
}

export default async function FrontDeskPage({ params }: FrontDeskPageProps) {
    const { subdomain } = await params;

    return (
        <FrontDeskClient subdomain={subdomain} />
    );
}
