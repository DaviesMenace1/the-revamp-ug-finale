import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing.')
}

// Serverless-optimized connection pool configuration
const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 1, // Strict limit: 1 connection per serverless instance to prevent pool exhaustion
  idle_timeout: 15, // Terminate idle connections after 15 seconds
  connect_timeout: 10, // Fail fast after 10 seconds if TCP/SSL handshake fails
  prepare: false, // Disables prepared statements (required if using Supabase/PgBouncer in Transaction mode)
})

export const db = drizzle(client, { schema })
