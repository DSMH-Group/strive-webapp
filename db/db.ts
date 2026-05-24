import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // We disable SSL verification for local dev if needed,
    // but Railway requires it for production.
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });