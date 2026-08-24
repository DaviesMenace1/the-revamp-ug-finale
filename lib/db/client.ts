import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

// Serverless-safe pool settings. Vercel spins up many short-lived function
// instances; without these, orphaned connections from invocations that end
// mid-query (timeout, cold-start recycling, etc.) pile up on the Postgres
// side forever, waiting on ClientRead for a client that's already gone —
// eventually exhausting the connection limit and stalling every query,
// including trivial ones.
const conn = globalForDb.conn ?? postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 1,               // one connection per function instance; let Supabase's pooler handle concurrency
  prepare: false,         // required for Supavisor transaction-mode pooling
  idle_timeout: 20,      // seconds — release an idle connection instead of holding it open
  connect_timeout: 5,    // seconds — fail before the protected-page budget expires
  max_lifetime: 60 * 30, // seconds — recycle connections periodically so nothing lingers indefinitely
  connection: {
    statement_timeout: 5000, // fail blocked/slow statements before the protected-page budget expires
    lock_timeout: 3000,      // do not wait indefinitely behind a database lock
  },
})

if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn

export const db = drizzle(conn, { schema })
