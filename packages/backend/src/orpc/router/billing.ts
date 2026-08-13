import { authed } from '../middleware.js'
import { prisma } from '@repo/database'
import { env } from '../../env.js'
import { z } from 'zod'
import { createCheckoutSession, type PlanType } from '../../dodo.js'
import { ORPCError } from '@orpc/client'

/**
 * Create a Dodo Payments checkout session for a given plan.
 * Returns { url } - the client redirects to this URL to complete payment.
 */
export const createCheckout = authed
  .input(z.object({ plan: z.enum(['INDIE', 'PRO']) }))
  .handler(async ({ input, context }) => {
    const { user } = context
    const baseUrl = env.BETTER_AUTH_URL

    try {
      const url = await createCheckoutSession({
        plan: input.plan as PlanType,
        userEmail: user.email,
        userId: user.id,
        successUrl: `${baseUrl}/dashboard?status=success`,
        cancelUrl: `${baseUrl}/pricing?status=cancelled`,
      })
      console.log(`[Dodo] 🟢 Checkout session created for ${user.email} → plan: ${input.plan}`)
      return { url }
    } catch (err: any) {
      console.error('[Dodo] 🔴 Failed to create checkout session:', err)
      const errorMsg = err?.message || 'Failed to create checkout session'
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: errorMsg })
    }
  })

/**
 * Returns the current user's plan and subscription status.
 */
export const getSubscription = authed.handler(async ({ context }) => {
  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { plan: true, subscriptionId: true, subscriptionStatus: true },
  })
  return {
    plan: (user?.plan ?? 'FREE') as 'FREE' | 'INDIE' | 'PRO',
    subscriptionId: user?.subscriptionId ?? null,
    subscriptionStatus: user?.subscriptionStatus ?? 'inactive',
  }
})
