// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    const url = request.nextUrl;

    // 1. BROADEN INTERNAL ASSET GUARDS: Ensure all NextJS manifests, dev assets, and static files pass safely
    // 🚀 INJECTED FORCE BYPASS: Exclude main root landing layout blocks completely from custom re-writes
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.') ||
        url.pathname.startsWith('/favicon') ||
        url.pathname === '/login' ||
        url.pathname === '/dashboard'
    ) {
        return NextResponse.next();
    }

    const hostHeader = request.headers.get("host") || "";
    const hostname = hostHeader.split(':')[0];

    console.log('[proxy] Incoming Request Footprint -> Host:', hostname, '| Path:', url.pathname);

    let subdomain: string | null = null;

    // 🚀 FIX: Swapped out old local domain references for clean dsmhgroup namespaces
    if (hostname.endsWith('.localhost')) {
        subdomain = hostname.replace('.localhost', '');
    } else if (hostname.endsWith('.dsmhgroup.local')) {
        subdomain = hostname.replace('.dsmhgroup.local', '');
    } else {
        const parts = hostname.split('.');

        if (parts.length >= 3) {
            subdomain = parts[0];
        }
    }

    // 2. ROOT HOST SYNC: Treat localhost, local test domains, and live apex as the primary admin platform
    const isMainSite =
        !subdomain ||
        subdomain === 'www' ||
        subdomain === 'strive' ||
        hostname === 'localhost' ||
        hostname === 'dsmhgroup.local' ||
        hostname === 'dsmhgroup.com' ||
        hostname.startsWith('strive-webapp-development'); // Keeping this if your staging container relies on it

    if (isMainSite) {
        return NextResponse.next();
    }

    console.log('[proxy] Active Workspace Subdomain Isolated:', subdomain);

    const requestHeaders = new Headers(request.headers);

    try {
        if (subdomain === 'test') {
            requestHeaders.set('x-tenant-id', 'test-gym-one');
        } else {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://strive-core-development.up.railway.app";

            const resolveRes = await fetch(`${backendUrl}/api/v1/meta/resolve?domain=${hostname}`, {
                headers: {
                    'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
                }
            });

            if (resolveRes.ok) {
                const tenantData = await resolveRes.json();
                if (tenantData?.id) {
                    requestHeaders.set('x-tenant-id', tenantData.id);
                }
            } else {
                console.error("[proxy] Core Engine rejected domain mapping parameters:", await resolveRes.text());
            }
        }
    } catch (error) {
        console.error("[proxy] Tenant configuration footprint lookup breakdown:", error);
    }

    const rewriteUrl = new URL(`/tenants/${subdomain}${url.pathname}`, request.url);
    console.log('[proxy] Redirecting lifecycle execution layer down to target route path:', rewriteUrl.pathname);

    return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
    });
}

export const config = {
    // 🚀 EXCLUDE /login completely from proxy mapping evaluations
    matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico).*)'],
};