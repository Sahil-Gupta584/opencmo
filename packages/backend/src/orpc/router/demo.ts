import { ORPCError } from '@orpc/client'
import { prisma } from '@repo/database'
import { env } from '../../env.js'
import { base } from '../middleware.js'

// Public, read-only dashboard snapshot used by the landing page preview.
// Only ever exposes the project configured via DEMO_PROJECT_ID - nothing else.
function getDemoProjectId(): string {
  if (!env.DEMO_PROJECT_ID) {
    throw new ORPCError('NOT_FOUND', { message: 'Demo dashboard is not configured' })
  }
  return env.DEMO_PROJECT_ID
}

export const listProjects = base.handler(async () => {
  const demoProjectId = getDemoProjectId()

  const project = await prisma.project.findUnique({
    where: { id: demoProjectId },
    include: {
      subreddits: true,
      dailyTasks: true,
      drafts: true,
      threads: true,
    },
  })

  return project ? [project] : []
})

export const testDb = base.handler(async () => {
  try {
    const userCount = await prisma.user.count()
    return { success: true, userCount, message: "Database connection is fully working!" }
  } catch (e: any) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: e.message })
  }
})