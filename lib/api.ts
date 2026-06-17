// src/lib/api.ts
import {authClient} from "@/lib/auth-client";

// In dev, route through the same-origin BFF proxy (app/api/be/[...path]) so the
// browser never makes a cross-origin call the backend's CORS would reject from
// a *.localhost tenant host. Production calls the backend directly.
const BASE_URL =
    process.env.NODE_ENV === "development"
        ? "/api/be"
        : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

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
export const striveClientFetch = async (endpoint: string, options: StriveFetchOptions = {}) => {
    // Change 2: Automatically get the Better-Auth session
    const sessionResponse = await authClient.getSession();

    // The deployed backend validates the bearer against the session row id
    // (verified empirically: id -> 200, token -> 401). Do not switch to .token.
    const sessionToken = sessionResponse?.data?.session?.id;

    if (!sessionToken) {
        throw new Error("No active session");
    }

    const customHeaders = new Headers(options.headers || {});
    customHeaders.set("Content-Type", "application/json");

    // Change 3: Use the Session Token for your NestJS backend
    customHeaders.set("Authorization", `Bearer ${sessionToken}`);

    if (options.tenantId) {
        customHeaders.set("X-Tenant-ID", options.tenantId);
    }

    return await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: customHeaders,
    });
};