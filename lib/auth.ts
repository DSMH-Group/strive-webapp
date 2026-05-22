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
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        }
    },
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
            additionalCookies: ["better-auth.session_token", "better-auth.session_data"],
            domain: process.env.NODE_ENV === 'development' ? 'localhost' : '.strive-webapp-development.up.railway.app'
        }
    },

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
            await db.update(schema.account)
                .set({accessToken: account.access_token})
                .where(eq(schema.account.userId, user.id));
        }
    }
});