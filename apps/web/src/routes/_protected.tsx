import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '#/lib/session'

// ---------------------------------------------------------------------------
// Auth guard - redirect to /login if no session
// ---------------------------------------------------------------------------
export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session?.user) {
      throw redirect({ to: '/login', search: {} })
    }

    const user = session.user
    const hasSubscription =
      user.subscriptionStatus === 'active' || !!user.subscriptionId

    const isPricingOrBilling =
      location.pathname === '/pricing' || location.pathname.includes('/settings')

    if (!isPricingOrBilling && !hasSubscription) {
      throw redirect({ to: '/pricing' })
    }

    return { user: session.user }
  },
  component: ProtectedLayout,
})

// ---------------------------------------------------------------------------
// Protected Layout Component
// ---------------------------------------------------------------------------
function ProtectedLayout() {
  return <Outlet />
}
