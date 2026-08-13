import { ORPCError } from '@orpc/client'
import { prisma } from '@repo/database'
import { env } from '../../env.js'
import { fetchInboundsForProject } from '../../inbounds-service.js'
import { generateDailyContentForProject } from '../../daily-content.js'
import { sendNewLeadsEmail } from '../../notifications.js'
import { base } from '../middleware.js'

// Gated by CRON_SECRET header - NOT a user session. Only the scheduler can call this.
export const cronAuthed = base.use(async ({ context, next }) => {
  const headers =
    context.headers instanceof Headers
      ? context.headers
      : new Headers(context.headers as Record<string, string>)

  const secret = headers.get('x-cron-secret')
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    throw new ORPCError('UNAUTHORIZED')
  }

  return next({ context })
})

export const runFetchCycle = cronAuthed.handler(async () => {
  const startedAt = Date.now()
  const projects = await prisma.project.findMany({ select: { id: true, name: true, userId: true } })
  console.log(`[Cron] Fetching inbounds for ${projects.length} projects...`)

  let totalNewLeads = 0

  for (const project of projects) {
    try {
      const result = await fetchInboundsForProject(project.id)
      totalNewLeads += result.newLeads.length
      console.log(`[Cron] ${project.name}: ${result.newLeads.length} new lead(s)`)

      if (result.success && result.newLeads.length > 0) {
        const user = await prisma.user.findUnique({
          where: { id: project.userId },
          select: { id: true, email: true, name: true, notifyNewLeads: true },
        })
        if (user) {
          await sendNewLeadsEmail(user, project.name, result.newLeads)
        }
      }
    } catch (err) {
      console.error(`🔴 [Cron] Failed for project ${project.id} (${project.name}):`, err)
    }
  }

  const durationMs = Date.now() - startedAt
  console.log(
    `[Cron] Cycle done in ${(durationMs / 1000).toFixed(1)}s - ${totalNewLeads} new leads total`,
  )

  return { projects: projects.length, totalNewLeads, durationMs }
})

export const runDailyContentCycle = cronAuthed.handler(async () => {
  const startedAt = Date.now()
  const projects = await prisma.project.findMany({ select: { id: true, name: true } })
  console.log(`[Cron] Generating daily content for ${projects.length} projects...`)

  let totalGenerated = 0
  let skippedCount = 0

  for (const project of projects) {
    try {
      const result = await generateDailyContentForProject(project.id)
      totalGenerated += result.generated
      if (result.skipped) skippedCount += 1
      console.log(`[Cron] ${project.name}: ${result.generated} item(s) generated${result.skipped ? ' (skipped - already generating or done within 24h)' : ''}`)
    } catch (err) {
      console.error(`🔴 [Cron] Failed to generate content for project ${project.id} (${project.name}):`, err)
    }
  }

  const durationMs = Date.now() - startedAt
  console.log(
    `[Cron] Content cycle done in ${(durationMs / 1000).toFixed(1)}s - ${totalGenerated} items generated, ${skippedCount} projects skipped`,
  )

  return { projects: projects.length, totalGenerated, skippedCount, durationMs }
})
