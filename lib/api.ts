// src/lib/api.ts
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
export const striveClientFetch = async (endpoint: string, options: StriveFetchOptions = {}) => {
    // Change 2: Automatically get the Better-Auth session
    const sessionResponse = await authClient.getSession();

    // This is your new "Source of Truth" token
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