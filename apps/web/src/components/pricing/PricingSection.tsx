import { PricingCards } from './PricingCards'

export function PricingSection() {
  return (
    <div>
      <div className="text-center mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-coral">Pricing</p>
        <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Simple, honest pricing
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted sm:text-base">
          Choose whether to bring your own AI key or let us handle AI usage for you.
        </p>
      </div>

      <PricingCards />

      <p className="mt-8 text-center text-xs text-faint">
        Self-host for free ·{' '}
        <a href="https://github.com" className="underline hover:text-ink">
          View on GitHub
        </a>
      </p>
    </div>
  )
}