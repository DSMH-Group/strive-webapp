import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from "@/lib/auth" // Better Auth instance

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get("host") || ""

    // 1. Skip middleware for internal Next.js paths & API routes
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.') // static files
    ) {
        return NextResponse.next()
    }

    // 2. Identify the Tenant
    // Local: localhost:3000 -> default to 'strive' (marketing)
    // Prod: gymname.stride.lk -> 'gymname'
    const isLocal = hostname.includes('localhost')
    const subdomain = isLocal ? null : hostname.split('.')[0]

    // If it's the main marketing site (stride.lk or localhost), let it through
    if (!subdomain || subdomain === 'www' || subdomain === 'stride') {
        return NextResponse.next()
    }

    /**
     * Senior Move: Path Rewriting
     * We rewrite /dashboard to /[tenantId]/dashboard internally.
     * The user still sees gymname.stride.lk/dashboard in their browser.
     */
    return NextResponse.rewrite(
        new URL(`/${subdomain}${url.pathname}`, request.url)
    )
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}