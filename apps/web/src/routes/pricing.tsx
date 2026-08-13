import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@heroui/react'
import { Brand } from '#/components/Brand'
import { PricingSection } from '#/components/pricing/PricingSection'
import { RiGithubLine, RiRedditLine, RiQuestionLine } from 'react-icons/ri'

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
]

function PricingPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-card border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Brand />
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Sahil-gupta584/opencmo"
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
        <PricingSection />

        {/* FAQs */}
        <div className="card-surface p-8 mt-16">
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
