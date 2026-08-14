import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}



const pool = new Pool({ 
  connectionString: databaseUrl,
  // Cloud providers like Supabase require SSL. Disable it only for local dev.
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
})

// WORKAROUND: PrismaPg sometimes ignores the schema option. 
// Force the schema on every new connection spawned by the pool.
const schemaName = new URL(databaseUrl).searchParams.get('schema') ?? 'public';
pool.on('connect', (client) => {
  client.query(`SET search_path TO "${schemaName}", public`);
});

const adapter = new PrismaPg(pool, {
  schema: schemaName,
})


declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export { PrismaClient } from '@prisma/client'
export type {
  Project,
  ProjectSubreddit,
  RedditThread,
  ContentDraft,
  DailyTask,
  InboundCursor,
  User,
  UserApiConfig,
} from '@prisma/client'
export { Prisma } from '@prisma/client'