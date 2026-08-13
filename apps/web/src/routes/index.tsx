import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { RiGithubLine } from 'react-icons/ri'
import { SiOpenai, SiClaude, SiPerplexity } from 'react-icons/si'
import { FaReddit } from 'react-icons/fa6'
import { Brand } from '#/components/Brand'

export const Route = createFileRoute('/')({ component: Home })

const NAV_LINKS = [
  { label: 'How it works', to: '#how-it-works' },
  { label: 'Roadmap', to: '#roadmap' },
  { label: 'Pricing', to: '/pricing' },
]

const AI_LOGOS = [
  { icon: SiOpenai, alt: 'ChatGPT', color: '#10A37F' },
  { icon: SiClaude, alt: 'Claude', color: '#D97757' },
  { icon: SiPerplexity, alt: 'Perplexity', color: '#20808D' },
]

const TITLE_GRADIENT: CSSProperties = {
  background: 'linear-gradient(90deg, #FF7059 0%, #F87986 25%, #E987B7 50%, #B98BDE 72%, #7E9FEA 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  backgroundSize: '200% auto',
  animation: 'shimmer 6s linear infinite',
}

function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logosDropped, setLogosDropped] = useState(false)
  const [redditDropped, setRedditDropped] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const logosRef = useRef<HTMLSpanElement>(null)
  const redditRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const title = titleRef.current
    const logos = logosRef.current
    const reddit = redditRef.current
    if (!title || !logos || !reddit) return

    let raf = 0
    let startTime = 0
    const startDelay = 750
    const duration = 2400
    let logosFrac = 0.45
    let redditFrac = 0.9

    const tick = (now: number) => {
      if (!startTime) startTime = now
      const t = Math.min(1, (now - startTime) / duration)
      const p = 1 - Math.pow(1 - t, 2)
      title.style.setProperty('--sweep', `${(p * 100).toFixed(2)}%`)
      if (p >= logosFrac) setLogosDropped(true)
      if (p >= redditFrac) setRedditDropped(true)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    const timer = setTimeout(() => {
      const titleRect = title.getBoundingClientRect()
      if (titleRect.width > 0) {
        const logosRect = logos.getBoundingClientRect()
        const redditRect = reddit.getBoundingClientRect()
        logosFrac = Math.min(1, Math.max(0, (logosRect.left - titleRect.left) / titleRect.width))
        redditFrac = Math.min(1, Math.max(0, (redditRect.left - titleRect.left) / titleRect.width))
      }
      raf = requestAnimationFrame(tick)
    }, startDelay)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FFFAF7] text-[#332A28]">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="relative border-b border-[#F2E8E3] bg-[#FFFAF7]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[80px] max-w-[1120px] items-center justify-between px-6">
          {/* Logo */}
          <Brand />

          {/* Center nav */}
          <nav className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to as any}
                className="nav-link text-sm font-medium text-[#796B66] no-underline"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link flex items-center gap-[7px] text-sm font-medium text-[#796B66] no-underline"
            >
              <RiGithubLine className="h-4 w-4" /> Open source
            </a>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-[38px]">
            <Link to="/dashboard" className="hidden text-sm font-semibold text-[#332A28] no-underline sm:block">
              Dashboard
            </Link>
            <Link to="/login" className="hidden text-sm font-semibold text-[#332A28] no-underline sm:block">
              Sign in
            </Link>
            <Link
              to="/login"
              className="flex h-10 items-center gap-[10px] rounded-full bg-[#302A29] px-5 text-[13px] font-semibold text-white no-underline transition-transform duration-150 hover:-translate-y-px"
            >
              Try OpenCMO <span className="text-[18px] leading-none">→</span>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
              aria-label="Toggle menu"
            >
              <span className="h-[2px] w-5 rounded bg-[#332A28]" />
              <span className="h-[2px] w-5 rounded bg-[#332A28]" />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-[#F2E8E3] px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.label}
                  to={l.to as any}
                  onClick={() => setMobileOpen(false)}
                  className="nav-link self-start text-sm font-medium text-[#796B66] no-underline"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-[#796B66] hover:text-[#332A28] no-underline"
              >
                Dashboard
              </Link>
              <Link to="/login" className="text-sm font-medium text-[#796B66] hover:text-[#332A28] no-underline">
                Sign in
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle square grid - fades out away from center, stops before the edges */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(226,202,194,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,202,194,0.35) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
            maskImage:
              'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 55%, transparent 90%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 55%, transparent 90%)',
          }}
        />

        {/* Atmospheric glows */}
        <div
          aria-hidden
          className="absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full opacity-[0.14]"
          style={{ background: 'radial-gradient(circle, #FFD9C9 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -right-32 top-20 h-[460px] w-[460px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #EBD6F5 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.16]"
          style={{ background: 'radial-gradient(circle, #FFD9C2 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-[1120px] px-6 pb-24 pt-[95px] text-center">
          {/* Badge */}
          <div
            className="mx-auto mb-[38px] inline-flex h-[35px] items-center gap-3 rounded-full border border-[#F0CEC5] bg-[#FFFDFC] px-6 shadow-[0_4px_18px_rgba(210,150,130,0.12)]"
            style={{ animation: 'hero-rise 0.6s ease-out' }}
          >
            <span
              className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#FF6F59]"
              style={{ animation: 'dot-pulse 2.2s ease-in-out infinite' }}
            />
            <span className="text-center text-[11px] font-semibold uppercase leading-[13px] tracking-[2px]" style={TITLE_GRADIENT}>
              Open source. Your AI keys.
            </span>
          </div>

          {/* Headline */}
          <h1
            ref={titleRef}
            className="relative mx-auto flex flex-col items-center text-[clamp(38px,6.5vw,72px)] font-medium leading-[1.1] tracking-[-2px]"
            style={{ fontFamily: "'Recoleta', serif", animation: 'hero-rise 0.6s ease-out 0.05s both' }}
          >
            {/* Layer 1: dark base text */}
            <span className="flex items-center gap-[0.35em] text-[#332A28]">
              Show up in
              <span ref={logosRef} className="flex items-center">
                {AI_LOGOS.map((logo, i) => (
                  <span
                    key={logo.alt}
                    className="-ml-[0.28em] first:ml-0 flex h-[1.05em] w-[1.05em] items-center justify-center rounded-full border border-[#F0E0DA] bg-white shadow-sm transition-transform duration-300 hover:scale-110"
                    style={
                      logosDropped
                        ? { animation: `logo-drop 0.7s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both` }
                        : { opacity: 0 }
                    }
                  >
                    <span style={{ animation: 'logo-float 3.5s ease-in-out infinite' }}>
                      <logo.icon style={{ color: logo.color }} className="block h-[0.6em] w-[0.6em]" />
                    </span>
                  </span>
                ))}
              </span>
              answers
            </span>

            <span className="flex items-center gap-[0.35em] text-[#332A28]">
              by being the answer on
              <span
                ref={redditRef}
                className="flex h-[0.9em] w-[0.9em] shrink-0 items-center justify-center rounded-full bg-[#FF4500] shadow-sm transition-transform duration-300 hover:scale-110"
                style={
                  redditDropped
                    ? { animation: 'logo-drop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.05s both' }
                    : { opacity: 0 }
                }
              >
                <span style={{ animation: 'reddit-bob 2.8s ease-in-out infinite' }}>
                  <FaReddit className="block h-[0.6em] w-[0.6em] text-white" />
                </span>
              </span>
            </span>

            {/* Layer 2: gradient overlay, revealed by the sweep */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex flex-col items-center"
              style={{
                ...TITLE_GRADIENT,
                maskImage:
                  'linear-gradient(to right, black 0%, black var(--sweep, 0%), transparent var(--sweep, 0%), transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to right, black 0%, black var(--sweep, 0%), transparent var(--sweep, 0%), transparent 100%)',
              }}
            >
              <span className="flex items-center gap-[0.35em]">
                Show up in
                <span className="flex items-center">
                  {AI_LOGOS.map((logo) => (
                    <span
                      key={logo.alt}
                      className="-ml-[0.28em] first:ml-0 block h-[1.05em] w-[1.05em]"
                      aria-hidden
                    />
                  ))}
                </span>
                answers
              </span>
              <span className="flex items-center gap-[0.35em]">
                by being the answer on
                <span className="block h-[0.9em] w-[0.9em] shrink-0" aria-hidden />
              </span>
            </span>
          </h1>

          {/* Description */}
          <p
            className="mx-auto mt-7 max-w-[620px] text-[18px] leading-[28px] text-[#806F69]"
            style={{ animation: 'hero-rise 0.6s ease-out 0.1s both' }}
          >
            AI pulls answers from Reddit threads. OpenCMO gets you into the ones worth joining - so your product becomes the answer.
          </p>

          {/* CTA row */}
          <div
            className="mt-[34px] flex flex-wrap items-center justify-center gap-3"
            style={{ animation: 'hero-rise 0.6s ease-out 0.15s both' }}
          >
            <Link
              to="/login"
              className="flex h-[50px] items-center gap-3 rounded-full bg-[#FF6F59] px-7 text-[13px] font-semibold text-white no-underline shadow-[0_8px_20px_rgba(255,111,89,0.18)] transition-all duration-200 hover:-translate-y-[1.5px] hover:bg-[#F87563] hover:shadow-[0_10px_26px_rgba(255,111,89,0.26)]"
            >
              Start with a signal <span className="text-[17px] leading-none">→</span>
            </Link>
            <a
              href="#how-it-works"
              className="flex h-[50px] items-center gap-[9px] rounded-full border border-[#E9D4CD] bg-[#FFFAF7] px-7 text-[13px] font-medium text-[#756661] no-underline transition-all duration-200 hover:-translate-y-[1.5px] hover:border-[#E0C4BC]"
            >
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
                <path d="M0 0l10 6-10 6V0z" fill="#756661" />
              </svg>
              See the workflow
            </a>
          </div>

          {/* Microcopy */}
          <p
            className="mt-[16px] text-xs tracking-[0.1px] text-[#AA9690]"
            style={{ animation: 'hero-rise 0.6s ease-out 0.2s both' }}
          >
            Bring your own AI subscription · $5/mo · no usage anxiety
          </p>
        </div>

        {/* Product preview shell */}
        <div className="relative mx-auto max-w-[1100px] px-6 pb-16">
          <div className="overflow-hidden rounded-[22px] border border-[#E9D4CD] bg-[#FFFCFA] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_5px_rgba(80,45,35,0.05),0_12px_24px_-6px_rgba(80,45,35,0.06),0_32px_80px_-16px_rgba(80,45,35,0.12)]">
            <div className="flex h-10 items-center justify-between border-b border-[#F0DDD7] px-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-[6px]">
                  <span className="h-[7px] w-[7px] rounded-full bg-[#FF6F59]" />
                  <span className="h-[7px] w-[7px] rounded-full bg-[#F5C78E]" />
                  <span className="h-[7px] w-[7px] rounded-full bg-[#9FCE9F]" />
                </div>
                <span className="ml-2 text-[10px] font-semibold uppercase tracking-[1px] text-[#B39B93]">
                  opencmo<span className="text-[#D9C6BE]"> /</span> workspace
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-[7px] w-[7px] rounded-full bg-[#7BC77B]" />
                <span className="text-[10px] font-medium text-[#9A8B85]">connected · your AI</span>
              </div>
            </div>
            <div className="flex items-center justify-center py-24 text-sm text-[#C8B4AC]">
              Your workspace preview
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-[#F2E8E3] py-16">
        <div className="mx-auto max-w-[1120px] px-6">
          <p className="mb-12 text-center text-xs font-semibold uppercase tracking-widest text-[#B8A29B]">
            How it works
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Add your product URL', desc: 'We read your site and understand what you sell and who you sell it to.' },
              { step: '02', title: 'We find buying-intent threads', desc: 'We monitor Reddit for people actively looking for what you built - not just keywords.' },
              { step: '03', title: 'Reply or post with AI', desc: 'Generate contextual replies and value-first posts. Copy and post manually - human in the loop.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tabular-nums text-[#FF6F59]">{step}</span>
                  <div className="h-px flex-1 bg-[#F2E8E3]" />
                </div>
                <h3 className="text-base font-semibold text-[#332A28]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#806F69]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-[1120px] px-6">
          <p className="mb-12 text-center text-xs font-semibold uppercase tracking-widest text-[#B8A29B]">
            Features
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { title: 'Inbounds', desc: 'Reddit threads where people are actively looking for your product - scored by buying intent.' },
              { title: 'Outbound Posts', desc: 'Value-first posts that feature your product naturally. One great post can drive real traffic.' },
              { title: 'Ban Sentinel', desc: 'Every draft scored for spam risk before you post. Keep your account safe.' },
            ].map(({ title, desc }) => (
              <div key={title} className="card-surface card-surface-hover flex flex-col gap-3 p-6">
                <h3 className="font-semibold text-[#332A28]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#806F69]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="border-t border-[#F2E8E3] py-16">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-[#B8A29B]">
            Pricing
          </p>
          <h2 className="mb-2 text-center text-3xl font-semibold tracking-tight text-[#332A28]">
            Simple, honest pricing
          </h2>
          <p className="mb-12 text-center text-sm text-[#806F69]">
            All plans include BYOK. No per-seat nonsense.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                name: 'Indie',
                price: '$5',
                features: [
                  'Bring Your Own AI Key (BYOK)',
                  '1 Product',
                  '200 inbounds / month',
                  '10 subreddits monitored',
                  'Background polling (every 6h)',
                  'Ban Sentinel risk scoring',
                ],
                popular: false,
              },
              {
                name: 'Pro',
                price: '$39',
                features: [
                  'Hosted AI Included (No API key needed)',
                  'Up to 5 Products',
                  'Unlimited inbounds',
                  'Unlimited subreddits',
                  'Fast background polling (every 2h)',
                  'Priority support',
                ],
                popular: true,
              },
            ].map(({ name, price, features, popular }) => (
              <div
                key={name}
                className={[
                  'relative flex flex-col gap-5 rounded-2xl p-7',
                  popular
                    ? 'border border-[#FF6F59] bg-[#FFFDFC] shadow-[0_8px_28px_rgba(255,111,89,0.14)]'
                    : 'border border-[#F0DDD7] bg-[#FFFDFC]',
                ].join(' ')}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF6F59] px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B8A29B]">{name}</p>
                  <p className="text-4xl font-semibold tracking-tight text-[#332A28]">
                    {price}
                    <span className="text-lg font-normal text-[#AA9690]">/mo</span>
                  </p>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#6d5f59]">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6F59]" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="mt-auto">
                  <span
                    className={[
                      'flex h-10 items-center justify-center rounded-full text-[13px] font-semibold no-underline transition-all duration-200 hover:-translate-y-px',
                      popular
                        ? 'bg-[#FF6F59] text-white shadow-[0_6px_16px_rgba(255,111,89,0.18)] hover:bg-[#F87563]'
                        : 'border border-[#E9D4CD] text-[#756661] hover:border-[#E0C4BC]',
                    ].join(' ')}
                  >
                    Get started
                  </span>
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-[#AA9690]">
            Self-host for free · <a href="https://github.com" className="underline hover:text-[#806F69]">View on GitHub</a>
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#F2E8E3]">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-8">
          <Brand size="sm" />
          <p className="text-xs text-[#AA9690]">© 2026 OpenCMO · Open source · Built for indie founders</p>
        </div>
      </footer>

      <style>{`
        @keyframes hero-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logo-drop {
          0% { opacity: 0; transform: translateY(-90px) scale(0.7); }
          60% { opacity: 1; transform: translateY(10px) scale(1.05); }
          80% { transform: translateY(-4px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logo-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(-3deg); }
        }
        @keyframes reddit-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 111, 89, 0.45); }
          50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(255, 111, 89, 0); }
        }
      `}</style>
    </div>
  )
}