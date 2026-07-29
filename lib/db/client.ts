import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL_NON_POOLING or DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
