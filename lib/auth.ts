// src/lib/auth.ts
import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import {genericOAuth, keycloak} from "better-auth/plugins"; // Removed 'google' from here
import {db} from "@/db/db";
import {eq} from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {...schema},
        camelCase: false
    }),

    baseURL: "https://dsmhgroup.com",

    // FIXED: Correct nested { create: { before: ... } } modern signature format
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    return {
                        data: {
                            ...user,
                            id: crypto.randomUUID(), // Force standard UUID string values
                        },
                    };
                },
            },
        },
        session: {
            create: {
                before: async (session) => {
                    return {
                        data: {
                            ...session,
                            id: crypto.randomUUID(), // Force standard UUID string values
                        },
                    };
                },
            },
        },
        account: {
            create: {
                before: async (account) => {
                    return {
                        data: {
                            ...account,
                            id: crypto.randomUUID(), // Force standard UUID string values
                        },
                    };
                },
            },
        },
    },

    // 1. Core Native Provider Engine
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },

    // 2. Core Social Provider Engine (Fixes TS2305)
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },

    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        }
    },

    advanced: {
        useSecureCookies: false, // no HTTPS in local dev
        crossSubDomainCookies: {
            enabled: true,
            additionalCookies: ["better-auth.session_data"],
            domain: '.dsmhgroup.com'
        },
        defaultCookieAttributes: {
            sameSite: "lax", // 'none' requires secure:true which requires HTTPS
            secure: false,
            httpOnly: true,
            domain: ".dsmhgroup.com",
        }
    },

    trustedOrigins: [
        "https://dsmhgroup.com",
        "https://*.dsmhgroup.com"
    ],

    user: {
        additionalFields: {
            keycloakId: {
                type: "string",
                required: false,
                input: false
            }
        }
    },

    // 3. Keep ONLY Custom / Legacy Extensions Here
    plugins: [
        genericOAuth({
            config: [
                keycloak({
                    issuer: process.env.KEYCLOAK_ISSUER!,
                    clientId: process.env.KEYCLOAK_CLIENT_ID!,
                    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
                })
            ]
        })
    ],
    callbacks: {
        onSuccess: async ({account, user}: { account: any, user: any }) => {
            if (account.access_token) {
                await db.update(schema.account)
                    .set({accessToken: account.access_token})
                    .where(eq(schema.account.userId, user.id));
            }
        }
    }
});