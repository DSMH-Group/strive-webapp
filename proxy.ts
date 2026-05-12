import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Senior Note: We've moved to proxy.ts per Next.js 16 conventions.
 * This handles our multi-tenant routing by rewriting URLs internally
 * based on the incoming subdomain.
 */
export async function proxy(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get("host") || ""

    // 1. Skip proxy logic for internal assets and API routes
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    // 2. Subdomain Detection Logic
    const isLocal = hostname.includes('localhost')
    const isRailway = hostname.includes('railway.app')

    // Split hostname: gym.stride.lk -> ['gym', 'stride', 'lk']
    const parts = hostname.split('.')
    const subdomain = parts.length > 2 ? parts[0] : null

    /**
     * 3. Identity the "Main Site"
     * We don't want to rewrite if:
     * - We are on localhost without a subdomain
     * - We are on the main Stride production/marketing domains
     * - We are on the specific Railway development URL
     */
    const isMainMarketingSite =
        !subdomain ||
        subdomain === 'www' ||
        subdomain === 'stride' ||
        hostname.startsWith('strive-webapp-development');

    if (isMainMarketingSite) {
        return NextResponse.next()
    }

    /**
     * 4. Multi-Tenant Rewrite
     * This takes gym.stride.lk/dashboard and internally
     * routes it to /app/[tenantId]/dashboard.
     */
    return NextResponse.rewrite(
        new URL(`/${subdomain}${url.pathname}`, request.url)
    )
}

// Keep the config export to tell Next.js which paths to proxy
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}