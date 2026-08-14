import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool, {
  schema: new URL(databaseUrl).searchParams.get('schema') ?? 'public',
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