// src/lib/auth-client.ts
import {createAuthClient} from "better-auth/react";

console.log("🌐 auth-client baseURL:", process.env.NEXT_PUBLIC_APP_URL);

// In local dev each tenant runs on its own host (e.g. test.localhost:3000) and
// the session cookie is host-scoped, so auth calls must stay same-origin —
// otherwise sign-out / get-session hit the wrong host and silently no-op.
// Production is unchanged (cookies are shared across *.dsmhgroup.com).
const resolveAuthBaseURL = () => {
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
    baseURL: resolveAuthBaseURL(),
});