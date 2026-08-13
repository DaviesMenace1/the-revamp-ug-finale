import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// ❌ REMOVE THIS:
// import * as schema from './schema'

// ✅ ADD THIS: Explicitly import every single table and relation you have
import { 
  products, 
  productImages, 
  productVariants, 
  productsRelations, 
  productImagesRelations, 
  productVariantsRelations,
  users // add any other tables/relations you have
} from './schema'

const connectionString = process.env.DATABASE_URL!

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const conn = globalForDb.conn ?? postgres(connectionString, {
  ssl: {
    rejectUnauthorized: false
  }
})

if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn

// ✅ ADD THIS: Manually construct the schema object
const exactSchema = {
  products,
  productImages,
  productVariants,
  productsRelations,
  productImagesRelations,
  productVariantsRelations,
  users
  // make sure ALL tables and ALL relations are listed here
}

// Pass the exactSchema object
export const db = drizzle(conn, { schema: exactSchema })



// import { drizzle } from 'drizzle-orm/postgres-js'
// import postgres from 'postgres'
// import * as schema from './schema'

// const connectionString = process.env.DATABASE_URL!

// const globalForDb = globalThis as unknown as {
//   conn: postgres.Sql | undefined
// }

// // 🔑 THE FIX: Add the ssl object with rejectUnauthorized: false
// const conn = globalForDb.conn ?? postgres(connectionString, {
//   ssl: {
//     rejectUnauthorized: false
//   }
// })

// if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn

// export const db = drizzle(conn, { schema })





// // import 'server-only'
// // import { drizzle } from 'drizzle-orm/node-postgres';
// // import { Pool } from 'pg';
// // import * as schema from './schema';


// // // DATABASE_URL = pooled connection (for app queries at runtime)
// // // DIRECT_URL   = direct connection (no pooler, used by drizzle-kit for migrations)
// // const connectionString = process.env.DATABASE_URL;

// // if (!connectionString) {
// //   throw new Error('DATABASE_URL is not set. Check your .env.development.local file.');
// // }

// // const pool = new Pool({
// //   connectionString,
// //   ssl: { rejectUnauthorized: false },
// // });

// // export const db = drizzle(pool, { schema });
// // export type DB = typeof db;
