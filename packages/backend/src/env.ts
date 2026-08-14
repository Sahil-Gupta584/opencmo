import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    FIRECRAWL_API_KEY: z.string().min(1).optional(),
    REDDIT_COOKIE: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
    TWITTER_BEARER_TOKEN: z.string().min(1).optional(),
    X_HOST: z.string().min(1).optional(),
    X_KEY: z.string().min(1).optional(),
    DODO_API_KEY: z.string().min(1).optional(),
    DODO_WEBHOOK_SECRET: z.string().min(1).optional(),
    DODO_INDIE_PRODUCT_ID: z.string().min(1).optional(),
    DODO_PRO_PRODUCT_ID: z.string().min(1).optional(),
    DODO_MODE: z.enum(['test_mode', 'live_mode']).optional().default('test_mode'),
    DEMO_PROJECT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  onValidationError: (issues) => {
    console.error('❌ Missing or invalid required environment variables in @repo/backend:\n', JSON.stringify(issues, null, 2))
    throw new Error(`Initialization failed: Missing or invalid environment variables in @repo/backend`)
  },
})
