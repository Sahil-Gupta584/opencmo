import { authed } from '../middleware.js'
import { prisma } from '@repo/database'
import { SaveMentionsInterestSchema, SaveAlertPrefSchema, TestDiscordWebhookSchema } from '../schema.js'
import { sendDiscordTestPing } from '../../notifications.js'

export const getMentionsInterest = authed.input(SaveMentionsInterestSchema.pick({ feature: true })).handler(async ({ input, context }) => {
  const record = await prisma.featureInterest.findUnique({
    where: { userId_feature: { userId: context.user.id, feature: input.feature } },
  })
  return { feature: input.feature, interested: record?.interested ?? null }
})

export const saveMentionsInterest = authed.input(SaveMentionsInterestSchema).handler(async ({ input, context }) => {
  const userId = context.user.id
  const record = await prisma.featureInterest.upsert({
    where: { userId_feature: { userId, feature: input.feature } },
    create: { userId, feature: input.feature, interested: input.interested },
    update: { interested: input.interested },
  })
  return { feature: record.feature, interested: record.interested }
})

export const getAlertPref = authed.handler(async ({ context }) => {
  const pref = await prisma.alertPref.findUnique({ where: { userId: context.user.id } })
  // Email is a channel now, default-selected. If no channels persisted yet,
  // fall back to Email so first-time users get email alerts by default.
  const channels = pref?.channels?.length ? pref.channels : ['Email']
  return {
    notifyInbounds: pref?.notifyInbounds ?? true,
    notifyOutbound: pref?.notifyOutbound ?? true,
    channels,
    discordEnabled: pref?.discordEnabled ?? false,
    discordWebhookUrl: pref?.discordWebhookUrl ?? '',
  }
})

export const saveAlertPref = authed.input(SaveAlertPrefSchema).handler(async ({ input, context }) => {
  const userId = context.user.id
  const channels = input.channels.length ? input.channels : ['Email']
  const pref = await prisma.alertPref.upsert({
    where: { userId },
    create: {
      userId,
      emailEnabled: channels.includes('Email'),
      notifyInbounds: input.notifyInbounds,
      notifyOutbound: input.notifyOutbound,
      channels,
      discordEnabled: input.discordEnabled ?? false,
      discordWebhookUrl: input.discordWebhookUrl?.trim() || null,
    },
    update: {
      emailEnabled: channels.includes('Email'),
      notifyInbounds: input.notifyInbounds,
      notifyOutbound: input.notifyOutbound,
      channels,
      ...(input.discordEnabled !== undefined ? { discordEnabled: input.discordEnabled } : {}),
      ...(input.discordWebhookUrl !== undefined ? { discordWebhookUrl: input.discordWebhookUrl.trim() || null } : {}),
    },
  })
  return {
    notifyInbounds: pref.notifyInbounds,
    notifyOutbound: pref.notifyOutbound,
    channels: pref.channels,
    discordEnabled: pref.discordEnabled,
    discordWebhookUrl: pref.discordWebhookUrl ?? '',
  }
})

export const testDiscordWebhook = authed.input(TestDiscordWebhookSchema).handler(async ({ input }) => {
  const result = await sendDiscordTestPing(input.webhookUrl)
  return result
})