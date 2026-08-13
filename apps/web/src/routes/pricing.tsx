import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { authClient } from '#/lib/auth-client'
import { Brand } from '#/components/Brand'
import { useState } from 'react'
import { RiCheckLine, RiGithubLine, RiRedditLine, RiQuestionLine } from 'react-icons/ri'

export const Route = createFileRoute('/pricing')({ component: PricingPage })

const FAQS = [
  {
    q: 'How does the Indie $5/mo plan work with BYOK?',
    a: 'You pay $5/mo to access the OpenCMO platform and supply your own AI API key (Google Gemini, OpenAI, or Anthropic). You pay the AI providers directly at wholesale API rates with no markup from us.',
  },
  {
    q: 'What is included in the Pro $39/mo plan?',
    a: 'The Pro plan includes complete hosted AI usage - we provide and manage the AI keys for you out of the box, plus support for up to 5 products, unlimited inbounds, and priority support.',
  },
  {
    q: 'Can I self-host OpenCMO for free?',
    a: "Yes! OpenCMO is 100% open source under the MIT license. You can clone the repo from GitHub and run it on your own infrastructure for free.",
  },
  {
    q: 'How does thread scanning work without the Reddit API?',
    a: "We query Reddit's public search endpoints using structured cursor-based polling. No expensive Reddit API subscription is required.",
  },
]

function PricingPage() {
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

  const handleSubscribe = async (plan: 'INDIE' | 'PRO') => {
    setErrorMsg(null)
    // Check if user is logged in first
    const { data: session } = await authClient.getSession()
    if (!session?.user) {
      // Not logged in - send to login with post-login redirect to checkout
      void navigate({ to: '/login', search: { redirect: `/checkout?plan=${plan}` } })
      return
    }
    // Logged in - create checkout directly
    checkout.mutate({ plan })
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-card border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Brand />
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition no-underline"
            >
              <RiGithubLine className="text-base" /> GitHub
            </a>
            <Link to="/login">
              <Button size="sm" color="primary" className="font-medium">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-coral mb-2">Pricing</p>
          <h1 className="text-4xl font-extrabold text-ink tracking-tight sm:text-5xl mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Choose whether to bring your own AI key or let us handle AI usage for you.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
            {errorMsg}
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2 mb-16">
          {/* Indie Plan */}
          <div className="card-surface card-surface-hover border-2 border-coral p-8 flex flex-col justify-between relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-coral px-3.5 py-0.5 text-xs font-semibold text-white">Most Popular</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-coral mb-2">Indie</p>
              <p className="text-5xl font-extrabold text-ink mb-2">$5<span className="text-lg font-medium text-faint">/mo</span></p>
              <p className="text-xs text-muted mb-6">Platform access using your own AI API key (BYOK).</p>
              <ul className="space-y-3.5 text-sm text-muted">
                <li className="flex items-center gap-2 font-medium text-ink"><RiCheckLine className="text-coral shrink-0 text-base" /> Bring Your Own AI Key (BYOK)</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-coral shrink-0 text-base" /> 1 Product</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-coral shrink-0 text-base" /> 200 Inbound Reddit leads / month</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-coral shrink-0 text-base" /> 10 Subreddits monitored</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-coral shrink-0 text-base" /> Background polling (every 6h)</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-coral shrink-0 text-base" /> Ban Sentinel risk scoring</li>
              </ul>
            </div>
            <div className="pt-8">
              <Button
                id="btn-subscribe-indie"
                color="primary"
                size="lg"
                fullWidth
                className="font-semibold"
                isLoading={checkout.isPending && checkout.variables?.plan === 'INDIE'}
                onPress={() => handleSubscribe('INDIE')}
              >
                Subscribe for $5/mo
              </Button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="card-surface p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-faint mb-2">Pro</p>
              <p className="text-5xl font-extrabold text-ink mb-2">$39<span className="text-lg font-medium text-faint">/mo</span></p>
              <p className="text-xs text-muted mb-6">Platform access with hosted AI usage included out of the box.</p>
              <ul className="space-y-3.5 text-sm text-muted">
                <li className="flex items-center gap-2 font-medium text-ink"><RiCheckLine className="text-emerald-500 shrink-0 text-base" /> Hosted AI Included (No API key needed)</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-emerald-500 shrink-0 text-base" /> Up to 5 Products</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-emerald-500 shrink-0 text-base" /> Unlimited Inbound leads</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-emerald-500 shrink-0 text-base" /> Unlimited Subreddits</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-emerald-500 shrink-0 text-base" /> Fast background polling (every 2h)</li>
                <li className="flex items-center gap-2"><RiCheckLine className="text-emerald-500 shrink-0 text-base" /> Priority support</li>
              </ul>
            </div>
            <div className="pt-8">
              <Button
                id="btn-subscribe-pro"
                variant="bordered"
                size="lg"
                fullWidth
                className="border-line-strong font-medium"
                isLoading={checkout.isPending && checkout.variables?.plan === 'PRO'}
                onPress={() => handleSubscribe('PRO')}
              >
                Get Pro for $39/mo
              </Button>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="card-surface p-8">
          <h2 className="text-2xl font-bold text-ink mb-6 flex items-center gap-2">
            <RiQuestionLine className="text-coral" /> Frequently Asked Questions
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="space-y-1.5">
                <h3 className="font-semibold text-ink text-base">{faq.q}</h3>
                <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
