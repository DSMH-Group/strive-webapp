import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    const url = request.nextUrl;

    // Strip port FIRST before any hostname logic
    const hostname = (request.headers.get("host") || "").split(':')[0];

    console.log('[proxy] hostname:', hostname, '| path:', url.pathname);

    // 1. Skip proxy logic for internal assets and API routes
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 2. Subdomain Detection
    let subdomain: string | null = null;

    if (hostname.endsWith('.localhost')) {
        subdomain = hostname.replace('.localhost', '');
    } else {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
            subdomain = parts[0];
        }
    }

    const isMainSite =
        !subdomain ||
        subdomain === 'www' ||
        subdomain === 'strive' ||
        hostname === 'localhost' ||
        hostname.startsWith('strive-webapp-development');

    if (isMainSite) {
        return NextResponse.next();
    }

    console.log('[proxy] tenant subdomain detected:', subdomain);

    // 3. Resolve Tenant ID
    const requestHeaders = new Headers(request.headers);

    try {
        if (hostname.endsWith('.localhost')) {
            requestHeaders.set('x-tenant-id', 'test-gym-one');
        } else {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
            const resolveRes = await fetch(`${backendUrl}/api/v1/meta/resolve?domain=${hostname}`, {
                headers: {
                    'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
                },
                next: { revalidate: 60 }
            });

            if (resolveRes.ok) {
                const tenantData = await resolveRes.json();
                if (tenantData?.id) {
                    requestHeaders.set('x-tenant-id', tenantData.id);
                }
            } else {
                console.error("[proxy] Backend rejected domain:", await resolveRes.text());
            }
        }
    } catch (error) {
        console.error("[proxy] Domain resolution failure:", error);
    }

    // 4. Rewrite to tenant route
    const rewriteUrl = new URL(`/tenants/${subdomain}${url.pathname}`, request.url);
    console.log('[proxy] rewriting to:', rewriteUrl.pathname);

    return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
    });
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}