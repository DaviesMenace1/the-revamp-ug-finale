import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';


// DATABASE_URL = pooled connection (for app queries at runtime)
// DIRECT_URL   = direct connection (no pooler, used by drizzle-kit for migrations)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Check your .env.development.local file.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
