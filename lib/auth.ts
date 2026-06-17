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
    baseURL: {
        allowedHosts: [
            "dsmhgroup.com",
            "www.dsmhgroup.com",
            "*.dsmhgroup.com",        // 🌟 Tells Better-Auth to actively accept and route subdomains!
            "localhost",
            "*.localhost"
        ],
        protocol: process.env.NODE_ENV === "development" ? "http" : "https",
        fallback: "https://dsmhgroup.com"
    },

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
        // Same treatment as Keycloak: only wire Google when credentials exist.
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? {
                  google: {
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                  },
              }
            : {}),
    },

    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        }
    },

    // 2. Cookie isolation policy.
    // Production locks cookies to the dsmhgroup.com apex so a session is shared
    // across tenant subdomains. Locally that breaks login: the browser drops
    // `secure` cookies and a `.dsmhgroup.com` domain on http://localhost, so we
    // relax to plain host cookies in development only.
    advanced:
        process.env.NODE_ENV === "development"
            ? {
                  useSecureCookies: false,
              }
            : {
                  useSecureCookies: true,
                  crossSubDomainCookies: {
                      enabled: true,
                      additionalCookies: ["better-auth.session_data"],
                      domain: "dsmhgroup.com",
                  },
                  defaultCookieAttributes: {
                      sameSite: "lax",
                      secure: true,
                      httpOnly: true,
                      domain: ".dsmhgroup.com",
                  },
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
        // Only register the Keycloak OAuth provider when its env vars are set.
        // Locally these are unset, so the plugin is skipped and email/password
        // auth still works without crashing on an undefined OIDC issuer.
        ...(process.env.KEYCLOAK_ISSUER &&
        process.env.KEYCLOAK_CLIENT_ID &&
        process.env.KEYCLOAK_CLIENT_SECRET
            ? [
                  genericOAuth({
                      config: [
                          keycloak({
                              issuer: process.env.KEYCLOAK_ISSUER,
                              clientId: process.env.KEYCLOAK_CLIENT_ID,
                              clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
                          }),
                      ],
                  }),
              ]
            : []),
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