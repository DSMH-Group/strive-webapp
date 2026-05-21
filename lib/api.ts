import { authClient } from "@/lib/auth-client";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

/**
 * Enterprise-grade fetch wrapper.
 * Automatically injects authentication headers from the active Better Auth session.
 */
export const striveClientFetch = async (endpoint: string, options: RequestInit = {}) => {
    // 1. Get the current active session
    // Note: authClient.getSession() is asynchronous and handles
    // retrieving the valid token from storage automatically.
    const session = await authClient.getSession();

    // 2. Extract the access token
    // Ensure 'token' matches the property provided by your auth configuration
    const accessToken = session?.data?.session?.token;

    // 3. Prepare headers
    const headers = new Headers(options.headers || {});

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    headers.set("Content-Type", "application/json");

    // 4. Execute request
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // 5. Global Error Handling
    if (response.status === 401) {
        // If we get a 401, we trigger a re-fetch of the session
        // to see if the client can recover the state.
        await authClient.getSession();
    }

    return response;
};