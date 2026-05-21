import { pgSchema, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Define the custom schema
export const authSchema = pgSchema("auth");

export const user = authSchema.table("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
    keycloakId: text("keycloak_id"),
});

export const session = authSchema.table(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id") // 👈 Explicitly snake_case in DB
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = authSchema.table(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(), // 👈 Explicitly snake_case in DB
        providerId: text("provider_id").notNull(), // 👈 Explicitly snake_case in DB
        userId: text("user_id") // 👈 Explicitly snake_case in DB
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"), // 👈 Explicitly snake_case in DB
        refreshToken: text("refresh_token"), // 👈 Explicitly snake_case in DB
        idToken: text("id_token"), // 👈 Explicitly snake_case in DB
        accessTokenExpiresAt: timestamp("access_token_expires_at"), // 👈 Explicitly snake_case in DB
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), // 👈 Explicitly snake_case in DB
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = authSchema.table(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// --- DRIZZLE RELATIONS SCHEMAS ---

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));