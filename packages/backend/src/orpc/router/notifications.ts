import { authed } from '../middleware.js'
import { prisma } from '@repo/database'
import { SaveNotificationPrefSchema } from '../schema.js'

export const getNotificationPref = authed.handler(async ({ context }) => {
  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { notifyNewLeads: true },
  })

  // Default ON for users created before the field existed
  return { notifyNewLeads: user?.notifyNewLeads ?? true }
})

export const saveNotificationPref = authed.input(SaveNotificationPrefSchema).handler(async ({ input, context }) => {
  await prisma.user.update({
    where: { id: context.user.id },
    data: { notifyNewLeads: input.notifyNewLeads },
  })

  return { notifyNewLeads: input.notifyNewLeads }
})