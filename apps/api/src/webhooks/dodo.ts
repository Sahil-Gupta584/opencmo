import { prisma } from '@repo/database'
import { dodo } from '@repo/backend'
import type { UnwrapWebhookEvent } from 'dodopayments/resources/webhooks'
import type { Request, Response } from 'express'

/**
 * Dodo Payments webhook handler at POST /api/webhook/dodo.
 * Registered with express.text() BEFORE the global json() parser so the raw
 * body is preserved for signature verification.
 */
export async function handleDodoWebhook(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as string

    // Convert Headers to plain object for dodopayments SDK
    const headersObj: Record<string, string> = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headersObj[key] = value
      else if (Array.isArray(value)) headersObj[key] = value.join(', ')
    }

    let event: UnwrapWebhookEvent
    try {
      event = dodo.webhooks.unwrap(body, { headers: headersObj })
    } catch (err) {
      console.error('[webhook] signature verification failed:', err)
      res.status(401).send('Invalid signature')
      return
    }

    console.log('[webhook] received event:', event.type)

    switch (event.type) {
      case 'payment.processing': {
        const payment = event.data
        const userId = payment.metadata?.userId as string | undefined
        const plan = payment.metadata?.plan as string | undefined
        if (!userId) {
          console.warn('[webhook] payment.processing missing userId in metadata')
          break
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan === 'PRO' ? 'PRO' : plan === 'INDIE' ? 'INDIE' : undefined,
            subscriptionStatus: 'processing',
          },
        })
        console.log(`[webhook] 🟡 User ${userId} payment processing for plan ${plan || 'unknown'}`)
        break
      }

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

    res.status(200).send('ok')
  } catch (err) {
    console.error('[webhook] error:', err)
    res.status(500).send('Internal error')
  }
}