// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // 1. Allow Next.js to accept development HMR connections across your local multi-tenant domains
    allowedDevOrigins: [
        'localhost:3000',
        '*.localhost:3000',
        'dsmhgroup.local:3000',
        '*.dsmhgroup.local:3000'
    ],

    // Fixes internal canonical 307 redirects coming from Cloudflare/Railway proxies
    skipTrailingSlashRedirect: true,

    // 2. Clear allowed origin contexts for client-side multi-tenant param passing
    experimental: {
        clientParamParsingOrigins: [
            'http://localhost:3000',
            'http://*.localhost:3000',
            'http://dsmhgroup.local:3000',
            'http://*.dsmhgroup.local:3000',
            'https://dsmhgroup.com',
            'https://*.dsmhgroup.com'
        ]
    }
};

export default nextConfig;