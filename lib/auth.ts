import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import { genericOAuth, keycloak } from "better-auth/plugins";
import {db} from "@/db/db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            ...schema
        }
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
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
});