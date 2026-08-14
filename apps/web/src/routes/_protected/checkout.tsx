import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Spinner } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { getSession } from '#/lib/session'

/**
 * /checkout?plan=INDIE|PRO
 *
 * This is a thin redirect page that:
 * 1. Requires authentication (protected by beforeLoad)
 * 2. Auto-triggers createCheckout on mount
 * 3. Redirects user to Dodo payment link immediately
 *
 * This page exists so the login flow can use it as callbackURL:
 *   /login?redirect=/checkout?plan=INDIE
 */
export const Route = createFileRoute('/_protected/checkout')({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: search.plan === 'PRO' ? ('PRO' as const) : ('INDIE' as const),
  }),
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session?.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: CheckoutPage,
})

function CheckoutPage() {
  const { plan } = Route.useSearch()
  const [error, setError] = useState<string | null>(null)

  const checkout = useMutation({
    ...orpc.createCheckout.mutationOptions(),
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (err: any) => {
      console.error('🔴 Checkout failed:', err)
      setError(err?.message || 'Failed to start checkout. Please try again.')
    },
  })

  useEffect(() => {
    checkout.mutate({ plan })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand px-4">
        <p className="text-sm text-red-600">{error}</p>
        <a href="/pricing" className="text-sm text-coral underline">
          Back to pricing
        </a>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand">
      <Spinner size="lg" color="primary" />
      <p className="text-sm text-muted">Redirecting to checkout…</p>
    </div>
  )
}
