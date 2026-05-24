// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // 1. Tell Next.js 16 it is completely safe to accept dev HMR handshakes from your local domains
    allowedDevOrigins: [
        'stride.local:3000',
        '*.stride.local:3000'
    ],

    // 2. Type-safe Next.js 16 experimental array mapping for your custom host context
    experimental: {
        clientParamParsingOrigins: [
            'http://stride.local:3000',
            'http://*.stride.local:3000'
        ]
    }
};

export default nextConfig;