import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Senior Note: We use a connection pool here to efficiently manage
 * connections to our Railway Postgres instance. In a serverless/edge
 * environment, this ensures we aren't exhausting the DB connection limit
 * during high traffic spikes in Sri Lankan gyms.
 */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // We disable SSL verification for local dev if needed,
    // but Railway requires it for production.
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });