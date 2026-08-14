import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    FIRECRAWL_API_KEY: z.string().min(1).optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
    BETTER_AUTH_URL: z.string().url(),
  },

  clientPrefix: 'VITE_',

  client: {
    VITE_SENTRY_DSN: z.string().url().optional(),
    VITE_SENTRY_ORG: z.string().optional(),
    VITE_SENTRY_PROJECT: z.string().optional(),
    VITE_API_URL: z.string().url().optional(),
    VITE_BETTER_AUTH_URL: z.string().url(),
  },
  
  runtimeEnv: {
    // Explicitly map client variables so Vite statically injects them during the Vercel build
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_SENTRY_ORG: import.meta.env.VITE_SENTRY_ORG,
    VITE_SENTRY_PROJECT: import.meta.env.VITE_SENTRY_PROJECT,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_BETTER_AUTH_URL: import.meta.env.VITE_BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL,
    
    // Server variables (only needed in SSR / API routes)
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  },

  emptyStringAsUndefined: true,
})
