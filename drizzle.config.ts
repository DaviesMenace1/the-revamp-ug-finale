import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // DIRECT_URL = direct connection (no pooler) — required for migrations
    url: process.env.DIRECT_URL!,
    ssl: true,
  },
  verbose: true,
  strict: true,
} satisfies Config;
