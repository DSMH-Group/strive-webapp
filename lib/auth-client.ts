// src/lib/auth-client.ts
import {createAuthClient} from "better-auth/react";

console.log("🌐 auth-client baseURL:", process.env.NEXT_PUBLIC_APP_URL);

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});