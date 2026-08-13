import DodoPayments from 'dodopayments'
import { env } from '#/env'

export const dodo = new DodoPayments({
  bearerToken: env.DODO_API_KEY ?? '',
  environment: env.DODO_MODE ?? 'live_mode',
  webhookKey: env.DODO_WEBHOOK_SECRET,
})

export type PlanType = 'INDIE' | 'PRO'

/**
 * Returns the Dodo product ID for a given plan.
 */
export function getProductId(plan: PlanType): string {
  const id = plan === 'INDIE' ? env.DODO_INDIE_PRODUCT_ID : env.DODO_PRO_PRODUCT_ID
  if (!id) throw new Error(`DODO_${plan}_PRODUCT_ID is not configured`)
  return id
}

/**
 * Creates a Dodo Payments checkout session matching Quickfeed's exact implementation.
 */
export async function createCheckoutSession(opts: {
  plan: PlanType
  userEmail: string
  userId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const productId = getProductId(opts.plan)

  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: {
      email: opts.userEmail,
    },
    return_url: opts.successUrl,
    metadata: { userId: opts.userId, plan: opts.plan },
  })

  const url = session.checkout_url
  if (!url) throw new Error('Dodo Payments did not return a checkout_url')
  return url
}
