import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import {genericOAuth, keycloak} from "better-auth/plugins";
import {db} from "@/db/db";
import {eq} from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            ...schema
        },
        camelCase: false
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        }
    },
    // Modern pattern to securely extend the user entity schema options
    user: {
        additionalFields: {
            keycloakId: {
                type: "string",
                required: false,
                input: false // Guard from untrusted arbitrary client-side writes
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
                    // Note: No extra custom object properties are needed or allowed here!
                })
            ]
        })
    ],
    callbacks: {
        onSuccess: async ({account, user}: { account: any, user: any }) => {
            // Persist the actual Keycloak Access Token to your database
            await db.update(schema.account)
                .set({accessToken: account.access_token})
                .where(eq(schema.account.userId, user.id));
        }
    }
});