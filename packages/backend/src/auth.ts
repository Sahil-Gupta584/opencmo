import { prismaAdapter } from 'better-auth/adapters/prisma'
import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'
import { prisma } from '@repo/database'
import { env } from './env.js'
import { Resend } from 'resend'

console.log({  baseURL: env.BETTER_AUTH_URL,
})
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: ["https://www.opencmo.site", "https://api.opencmo.site"],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain:"opencmo.site"
    },
  },
  logger: {
    disabled: true,
  },
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  user: {
    additionalFields: {
      plan: { type: 'string', required: false, defaultValue: 'FREE' },
      subscriptionId: { type: 'string', required: false },
      subscriptionStatus: { type: 'string', required: false, defaultValue: 'inactive' },
      notifyNewLeads: { type: 'boolean', required: false, defaultValue: true },
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const resend = new Resend(env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: 'noreply@chatcash.live',
          to: email,
          subject: 'Your magic link',
          html: `<p>Click the link below to sign in:</p><a href="${url}">${url}</a>`,
        })
        if (error) throw new Error(`Failed to send magic link email: ${error.message}`)
      },
    }),
  ],
})
