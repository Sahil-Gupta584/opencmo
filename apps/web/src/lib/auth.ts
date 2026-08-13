import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { prisma } from "@repo/database";
import { env } from "#/env";

export const auth = betterAuth({
  baseURL: env.VITE_BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET || 'd3v-s3cr3t-k3y-32-byt3s-long-secret!',
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      plan: { type: "string", required: false, defaultValue: "FREE" },
      subscriptionId: { type: "string", required: false },
      subscriptionStatus: { type: "string", required: false, defaultValue: "inactive" },
      notifyNewLeads: { type: "boolean", required: false, defaultValue: true },
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  plugins: [
    tanstackStartCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const { Resend } = await import('resend')
        const resend = new Resend(env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: 'noreply@chatcash.live',
          to: email,
          subject: 'Your magic link',
          html: `<p>Click the link below to sign in:</p><a href="${url}">${url}</a>`,
        })
        if (error) {
          throw new Error(`Failed to send magic link email: ${error.message}`)
        }
      },
    }),
  ],
})
