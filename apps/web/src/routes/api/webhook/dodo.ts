import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@repo/database'
import { dodo } from '#/lib/dodo'
import type { UnwrapWebhookEvent } from 'dodopayments/resources/webhooks'

/**
 * Dodo Payments webhook handler at POST /api/webhook/dodo (Quickfeed pattern)
 */
async function handle({ request }: { request: Request }) {
  try {
    const body = await request.text()

    // Convert Headers to plain object for dodopayments SDK
    const headersObj: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headersObj[key] = value
    })

    // Verify + parse webhook via SDK
    let event: UnwrapWebhookEvent
    try {
      event = dodo.webhooks.unwrap(body, { headers: headersObj })
    } catch (err) {
      console.error('[webhook] signature verification failed:', err)
      return new Response('Invalid signature', { status: 401 })
    }

    console.log('[webhook] received event:', event.type)

    switch (event.type) {
      case 'subscription.active': {
        const sub = event.data
        const userId = sub.metadata?.userId as string | undefined
        const plan = sub.metadata?.plan as string | undefined
        if (!userId) {
          console.warn('[webhook] subscription.active missing userId in metadata')
          break
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan === 'PRO' ? 'PRO' : 'INDIE',
            subscriptionId: sub.subscription_id,
            subscriptionStatus: 'active',
          },
        })
        console.log(`[webhook] 🟢 User ${userId} upgraded to ${plan || 'INDIE'}`)
        break
      }

      case 'subscription.renewed': {
        const sub = event.data
        const userId = sub.metadata?.userId as string | undefined
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: 'active' },
          })
        }
        break
      }

      case 'subscription.plan_changed': {
        const sub = event.data
        const userId = sub.metadata?.userId as string | undefined
        const plan = sub.metadata?.plan as string | undefined
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: plan === 'PRO' ? 'PRO' : 'INDIE',
              subscriptionStatus: 'active',
            },
          })
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired':
      case 'subscription.failed':
      case 'subscription.on_hold': {
        const sub = event.data
        const userId = sub.metadata?.userId as string | undefined
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: 'FREE',
              subscriptionStatus: event.type.split('.')[1],
            },
          })
          console.log(`[webhook] 🟡 User ${userId} status changed to ${event.type}`)
        }
        break
      }

      default:
        console.log('[webhook] unhandled event type:', (event as any).type)
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[webhook] error:', err)
    return new Response('Internal error', { status: 500 })
  }
}

export const Route = createFileRoute('/api/webhook/dodo')({
  server: {
    handlers: {
      POST: handle,
    },
  },
})
