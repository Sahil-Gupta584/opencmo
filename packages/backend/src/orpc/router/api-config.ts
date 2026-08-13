import { authed } from '../middleware.js'
import { prisma } from '@repo/database'
import { encrypt } from '../../crypto.js'
import { SaveApiConfigSchema } from '../schema.js'

export const getApiConfig = authed.handler(async ({ context }) => {
  const config = await prisma.userApiConfig.findUnique({
    where: { userId: context.user.id },
  })

  if (!config) return null

  return {
    defaultProvider: config.defaultProvider,
    hasOpenaiKey: Boolean(config.openaiKey),
    hasAnthropicKey: Boolean(config.anthropicKey),
    hasGeminiKey: Boolean(config.geminiKey),
  }
})

export const saveApiConfig = authed.input(SaveApiConfigSchema).handler(async ({ input, context }) => {
  const userId = context.user.id

  const existing = await prisma.userApiConfig.findUnique({ where: { userId } })

  const encryptedOpenai = input.openaiKey ? encrypt(input.openaiKey) : existing?.openaiKey
  const encryptedAnthropic = input.anthropicKey ? encrypt(input.anthropicKey) : existing?.anthropicKey
  const encryptedGemini = input.geminiKey ? encrypt(input.geminiKey) : existing?.geminiKey

  return prisma.userApiConfig.upsert({
    where: { userId },
    create: {
      userId,
      defaultProvider: input.defaultProvider,
      openaiKey: encryptedOpenai,
      anthropicKey: encryptedAnthropic,
      geminiKey: encryptedGemini,
    },
    update: {
      defaultProvider: input.defaultProvider,
      openaiKey: encryptedOpenai,
      anthropicKey: encryptedAnthropic,
      geminiKey: encryptedGemini,
    },
  })
})
