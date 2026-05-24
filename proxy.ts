// src/proxy.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
    const url = request.nextUrl;
    const origin = request.headers.get("origin") || "";

    console.log(`\n--- [PROXY TRACE] START TRACE FOR: ${request.method} ${url.href} ---`);
    console.log(`[PROXY TRACE] [INIT] Raw Details -> Pathname: "${url.pathname}", Origin Header: "${origin || 'NONE'}"`);

    // 1. BROADEN INTERNAL ASSET GUARDS
    const isAssetOrReserved =
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.') ||
        url.pathname.startsWith('/favicon') ||
        url.pathname === '/login' ||
        url.pathname === '/dashboard';

    console.log(`[PROXY TRACE] [EVAL-1] Checking internal asset/reserved guard conditions:`, {
        pathname: url.pathname,
        startsWithNext: url.pathname.startsWith('/_next'),
        startsWithApi: url.pathname.startsWith('/api'),
        includesDot: url.pathname.includes('.'),
        isFavicon: url.pathname.startsWith('/favicon'),
        isLogin: url.pathname === '/login',
        isDashboard: url.pathname === '/dashboard',
        MATCHED_GUARD: isAssetOrReserved
    });

    if (isAssetOrReserved) {
        console.log(`[PROXY TRACE] [GUARD-HIT] Route identified as reserved or asset. Bypassing tenant rewriting mechanics.`);

        if (url.pathname.startsWith('/api/auth')) {
            console.log(`[PROXY TRACE] [AUTH-CORS] Intercepted cross-origin auth endpoint path: "${url.pathname}"`);
            const response = NextResponse.next();

            const isAllowedOrigin = origin === "https://dsmhgroup.com" || origin.endsWith(".dsmhgroup.com");
            console.log(`[PROXY TRACE] [AUTH-CORS] Evaluating origin validity: "${origin}" -> Allowed: ${isAllowedOrigin}`);

            if (isAllowedOrigin) {
                console.log(`[PROXY TRACE] [AUTH-CORS] Appending strict dynamic CORS headers to response handshake stream.`);
                response.headers.set("Access-Control-Allow-Origin", origin);
                response.headers.set("Access-Control-Allow-Credentials", "true");
                response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
                response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            } else {
                console.warn(`[PROXY TRACE] [AUTH-CORS] Origin "${origin}" failed domain suffix alignment rules. Omitted CORS headers.`);
            }
            console.log(`--- [PROXY TRACE] END TRACE (Auth API Pass-Through) ---\n`);
            return response;
        }

        console.log(`[PROXY TRACE] [ASSET-PASS] Standard pipeline execution. Falling through via NextResponse.next()`);
        console.log(`--- [PROXY TRACE] END TRACE (Asset Pass-Through) ---\n`);
        return NextResponse.next();
    }

    const hostHeader = request.headers.get("host") || "";
    const hostname = hostHeader.split(':')[0];
    console.log(`[PROXY TRACE] [HOST-PARSING] Raw Host Header: "${hostHeader}" | Extracted Hostname Node: "${hostname}"`);

    let subdomain: string | null = null;

    // Subdomain Extraction Logic Core Trace
    if (hostname.endsWith('.localhost')) {
        subdomain = hostname.replace('.localhost', '');
        console.log(`[PROXY TRACE] [SUBDOMAIN-MATCH] Parsed .localhost suffix pattern. Extracted Tenant Subdomain: "${subdomain}"`);
    } else if (hostname.endsWith('.dsmhgroup.local')) {
        subdomain = hostname.replace('.dsmhgroup.local', '');
        console.log(`[PROXY TRACE] [SUBDOMAIN-MATCH] Parsed .dsmhgroup.local suffix pattern. Extracted Tenant Subdomain: "${subdomain}"`);
    } else {
        const parts = hostname.split('.');
        console.log(`[PROXY TRACE] [SUBDOMAIN-MATCH] Standard domain tree split metrics:`, parts);
        if (parts.length >= 3) {
            subdomain = parts[0];
            console.log(`[PROXY TRACE] [SUBDOMAIN-MATCH] Suffix fallback structural depth >= 3 arrays. Assigned Index 0 Node Subdomain: "${subdomain}"`);
        } else {
            console.log(`[PROXY TRACE] [SUBDOMAIN-MATCH] Structural domain depth < 3 nodes. No implicit subdomain detected.`);
        }
    }

    // 2. ROOT HOST SYNC: Evaluate if current deployment container serves the core app framework
    const isMainSite =
        !subdomain ||
        subdomain === 'www' ||
        subdomain === 'strive' ||
        hostname === 'localhost' ||
        hostname === 'dsmhgroup.local' ||
        hostname === 'dsmhgroup.com' ||
        hostname.startsWith('strive-webapp-development');

    console.log(`[PROXY TRACE] [EVAL-2] Asserting Core Platform Identity Matrix:`, {
        subdomain: subdomain,
        hostname: hostname,
        isMainSiteEvaluation: isMainSite
    });

    if (isMainSite) {
        console.log(`[PROXY TRACE] [CORE-PASS] Target host identified as Core Platform Root context. Bypassing layout rewrite blocks.`);
        console.log(`--- [PROXY TRACE] END TRACE (Core Site Standard Handoff) ---\n`);
        return NextResponse.next();
    }

    console.log(`[PROXY TRACE] [TENANT-DETECTED] Routing pipeline pinned to isolated scope -> Subdomain: "${subdomain}"`);

    const requestHeaders = new Headers(request.headers);
    console.log(`[PROXY TRACE] [HEADERS-INIT] Instantiated fresh target request header tracking map.`);

    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://strive-core-development.up.railway.app";
        const internalSecretExists = !!process.env.INTERNAL_API_SECRET;

        console.log(`[PROXY TRACE] [BACKEND-FETCH] Handshaking NestJS Infrastructure metadata registry...`, {
            resolutionTargetUrl: `${backendUrl}/api/v1/meta/resolve?domain=${hostname}`,
            internalSecretConfigured: internalSecretExists
        });

        const resolveRes = await fetch(`${backendUrl}/api/v1/meta/resolve?domain=${hostname}`, {
            headers: {
                'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
            }
        });

        console.log(`[PROXY TRACE] [BACKEND-FETCH] Resolution response received. HTTP Status: ${resolveRes.status}`);

        if (resolveRes.ok) {
            const tenantData = await resolveRes.json();
            console.log(`[PROXY TRACE] [BACKEND-FETCH] Decoded metadata payload object output:`, tenantData);

            if (tenantData?.id) {
                console.log(`[PROXY TRACE] [HEADER-MUTATION] Successfully resolved tenant UUID mapping context! Writing Header -> "x-tenant-id": "${tenantData.id}"`);
                requestHeaders.set('x-tenant-id', tenantData.id);
            } else {
                console.error(`[PROXY TRACE] [HEADER-ERROR] Payload object compiled successfully but properties are missing critical field "id".`);
            }
        } else {
            const errorBodyText = await resolveRes.text();
            console.error(`[PROXY TRACE] [BACKEND-REJECTION] Core server failed lookup validation routine:`, {
                statusCode: resolveRes.status,
                statusMessage: resolveRes.statusText,
                errorBodyText: errorBodyText
            });
        }
    } catch (error: any) {
        console.error("[PROXY TRACE] [CRITICAL-EXCEPTION] Execution failure occurred within backend resolution network loop:", error.message || error);
    }

    // Rewrite Application Mapping Core Phase
    const rewriteUrl = new URL(`/tenants/${subdomain}${url.pathname}`, request.url);
    console.log(`[PROXY TRACE] [ROUTING-REWRITE] Finalizing Internal Vercel NextJS Route Mapping:`, {
        originatingUrl: url.pathname,
        targetedInternalPath: rewriteUrl.pathname,
        configuredHeaderContextTenantId: requestHeaders.get('x-tenant-id') || 'UNSET/NULL'
    });

    console.log(`--- [PROXY TRACE] END TRACE (Executing Tenant Route Rewrite Layout) ---\n`);

    return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
    });
}

export const config = {
    // 🚀 EXCLUDE /login completely from proxy mapping evaluations
    matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico).*)'],
};