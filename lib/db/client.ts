import { drizzle } from 'drizzle-orm/postgres-js' // or '@neondatabase/serverless' / 'node-postgres'
import postgres from 'postgres'
import * as schema from './schema' // 🔑 1. IMPORT ALL SCHEMA EXPORTS

const connectionString = process.env.DATABASE_URL!

// Cache the database client connection in development to prevent too many connections during Next.js hot-reloading
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const conn = globalForDb.conn ?? postgres(connectionString)
if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn

// 🔑 2. PASS { schema } TO DRIZZLE
export const db = drizzle(conn, { schema })




// import 'server-only'
// import { drizzle } from 'drizzle-orm/node-postgres';
// import { Pool } from 'pg';
// import * as schema from './schema';


// // DATABASE_URL = pooled connection (for app queries at runtime)
// // DIRECT_URL   = direct connection (no pooler, used by drizzle-kit for migrations)
// const connectionString = process.env.DATABASE_URL;

// if (!connectionString) {
//   throw new Error('DATABASE_URL is not set. Check your .env.development.local file.');
// }

// const pool = new Pool({
//   connectionString,
//   ssl: { rejectUnauthorized: false },
// });

// export const db = drizzle(pool, { schema });
// export type DB = typeof db;
