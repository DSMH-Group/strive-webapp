// src/lib/auth.ts
import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import {genericOAuth, keycloak} from "better-auth/plugins";
import {db} from "@/db/db";
import {eq} from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {...schema},
        camelCase: false
    }),

    // 1. Dynamic Host Routing Core
    baseURL: "https://dsmhgroup.com",

    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    return {data: {...user, id: crypto.randomUUID()}};
                },
            },
        },
        session: {
            create: {
                before: async (session) => {
                    return {data: {...session, id: crypto.randomUUID()}};
                },
            },
        },
        account: {
            create: {
                before: async (account) => {
                    return {data: {...account, id: crypto.randomUUID()}};
                },
            },
        },
    },

    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },

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

    // 2. Automated Production Cookie Isolation Policy
    advanced: {
        useSecureCookies: true,
        crossSubDomainCookies: {
            enabled: true,
            additionalCookies: ["better-auth.session_data"],
            domain: "dsmhgroup.com"
        },
        defaultCookieAttributes: {
            sameSite: "lax",
            secure: true,
            httpOnly: true,
            domain: ".dsmhgroup.com",
        }
    },

    trustedOrigins: [
        "https://dsmhgroup.com",
        "https://*.dsmhgroup.com",
        "http://localhost:3000",
        "http://*.localhost:3000"
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