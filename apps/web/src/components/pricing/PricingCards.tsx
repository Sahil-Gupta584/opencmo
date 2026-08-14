import { Button } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { RiCheckLine } from 'react-icons/ri'
import { orpc } from '#/lib/orpc'
import { authClient } from '#/lib/auth-client'

type Plan = 'INDIE' | 'PRO'

const PLANS: {
  key: Plan
  name: string
  price: string
  blurb: string
  features: { text: string; accent?: boolean }[]
  highlight: boolean
}[] = [
  {
    key: 'INDIE',
    name: 'Indie',
    price: '$5',
    blurb: 'Platform access using your own AI API key (BYOK).',
    features: [
      { text: 'Bring Your Own AI Key (BYOK)', accent: true },
      { text: '1 Product' },
      { text: '200 Inbound Reddit leads / month' },
      { text: '10 Subreddits monitored' },
      { text: 'Background polling (every 6h)' },
      { text: 'Ban Sentinel risk scoring' },
    ],
    highlight: true,
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: '$39',
    blurb: 'Platform access with hosted AI usage included out of the box.',
    features: [
      { text: 'Hosted AI Included (No API key needed)', accent: true },
      { text: 'Up to 5 Products' },
      { text: 'Unlimited Inbound leads' },
      { text: 'Unlimited Subreddits' },
      { text: 'Fast background polling (every 2h)' },
      { text: 'Priority support' },
    ],
    highlight: false,
  },
]

export function PricingCards() {
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const checkout = useMutation({
    ...orpc.createCheckout.mutationOptions(),
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || 'Something went wrong. Please try again.')
      console.error('🔴 Checkout error:', err)
    },
  })

  const handleSubscribe = async (plan: Plan) => {
    setErrorMsg(null)
    const { data: session } = await authClient.getSession()
    if (!session?.user) {
      navigate({ to: '/login', search: { redirect: `/checkout?plan=${plan}` } })
      return
    }
    checkout.mutate({ plan })
  }

  return (
    <>
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-8 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={[
              'p-8 flex flex-col justify-between relative',
              plan.highlight ? 'card-surface card-surface-hover border-2 border-coral' : 'card-surface',
            ].join(' ')}
          >
            <div>
              <p
                className={[
                  'text-xs font-semibold uppercase tracking-widest mb-2',
                  plan.highlight ? 'text-coral' : 'text-faint',
                ].join(' ')}
              >
                {plan.name}
              </p>
              <p className="text-5xl font-extrabold text-ink mb-2">
                {plan.price}
                <span className="text-lg font-medium text-faint">/mo</span>
              </p>
              <p className="text-xs text-muted mb-6">{plan.blurb}</p>
              <ul className="space-y-3.5 text-sm text-muted">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2">
                    <RiCheckLine
                      className={['shrink-0 text-base', f.accent ? 'text-coral' : ''].join(' ')}
                    />
                    <span className={f.accent ? 'font-medium text-ink' : ''}>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <Button
                id={`btn-subscribe-${plan.key.toLowerCase()}`}
                color="primary"
                size="lg"
                fullWidth
                variant={plan.key === 'PRO' ? 'bordered' : 'solid'}
                className={plan.key === 'PRO' ? 'border-line-strong font-medium' : 'font-semibold'}
                isLoading={checkout.isPending && checkout.variables?.plan === plan.key}
                onPress={() => handleSubscribe(plan.key)}
              >
                {plan.key === 'INDIE' ? 'Subscribe for $5/mo' : 'Get Pro for $39/mo'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}