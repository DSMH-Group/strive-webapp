import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({
    path: ".env.local",
});

export default defineConfig({
    schema: "./db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    // Senior Move: This ensures Better Auth tables live in their own
    // sandbox, away from your NestJS business logic tables.
    schemaFilter: ["auth"],
});