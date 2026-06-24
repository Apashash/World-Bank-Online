import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "[db] FATAL: SUPABASE_DATABASE_URL and DATABASE_URL are both missing. " +
    "Set one in your environment variables (Plesk → Custom environment variables). " +
    "The server will start but all database operations will fail."
  );
}

export const pool = new Pool({
  connectionString: connectionString ?? "postgresql://localhost/placeholder",
  ssl: process.env.SUPABASE_DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
