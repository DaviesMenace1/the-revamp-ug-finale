import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
