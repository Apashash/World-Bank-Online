import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "[db] FATAL: DATABASE_URL is missing. " +
    "The server will start but all database operations will fail."
  );
}

export const pool = new Pool({
  connectionString: connectionString ?? "postgresql://localhost/placeholder",
});

export const db = drizzle(pool, { schema });

export * from "./schema";
