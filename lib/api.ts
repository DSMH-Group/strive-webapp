import {authClient} from "@/lib/auth-client";


const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

/**
 * Extended RequestInit to natively support Stride's Multi-Tenant architecture.
 */
interface StriveFetchOptions extends RequestInit {
    tenantId?: string;
}

/**
 * Enterprise-grade fetch wrapper for Stride Core Engine.
 * Automatically injects JWT authentication and X-Tenant-ID headers.
 */
export const striveClientFetch = async (endpoint: string, keycloakAccessToken: string, options: StriveFetchOptions = {}) => {
    // 1. Get the current active session
    const sessionResponse = await authClient.getSession();

    // 2. Extract the JWT token
    // Better Auth uses session.id or requires the jwt() plugin to expose a signed token.
    // Make sure your Better Auth config issues a JWT compatible with your NestJS backend.
    const accessToken = sessionResponse?.data?.session?.id;

    // 3. Prepare headers
    const customHeaders = new Headers(options.headers || {});
    customHeaders.set("Content-Type", "application/json");

    customHeaders.set("Authorization", `Bearer ${keycloakAccessToken}`);

    // 4. Inject Tenant Context (Crucial for B2B Gym Operations)
    // If working in the frontend, this could also be dynamically pulled
    // from window.location.hostname based on your Edge Routing logic.
    if (options.tenantId) {
        customHeaders.set("X-Tenant-ID", options.tenantId);
    }


    // 5. Execute request
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: customHeaders,
    });

    // 6. Global Error Handling & State Recovery
    if (response.status === 401) {
        console.error("[Strive Fetch] 401 Unauthorized: Invalid Stride access token.");

        // In the Sri Lankan market, mobile users on spotty 4G might face session drops.
        // If a session becomes invalid, we forcefully clear local state to prevent a corrupted UI loop.
        // Optional: Trigger a redirect to the central Login with Stride portal.
        if (typeof window !== "undefined") {
            // window.location.href = '/login';
        }
    }

    return response;
};