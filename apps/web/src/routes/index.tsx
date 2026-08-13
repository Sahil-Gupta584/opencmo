import { createFileRoute, Link } from '@tanstack/react-router'
import { Tabs, Tab } from '@heroui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  RiGithubLine,
  RiInboxLine,
  RiVoiceprintLine,
  RiSendPlaneLine,
  RiCheckLine,
  RiRedditLine,
  RiBellLine,
  RiNotification3Line,
  RiSettingsLine,
  RiMailLine,
} from 'react-icons/ri'
import { SiOpenai, SiClaude, SiPerplexity, SiSlack, SiDiscord } from 'react-icons/si'
import { FaReddit, FaWhatsapp } from 'react-icons/fa6'
import { Brand } from '#/components/Brand'
import { PricingSection } from '#/components/pricing/PricingSection'
import { ThreadCard } from '#/components/dashboard/atoms/ThreadCard'
import { SubredditCard } from '#/components/dashboard/atoms/SubredditCard'
import { EmptyState } from '#/components/dashboard/atoms/EmptyState'
import { ChannelFilterPills, type ChannelKey } from '#/components/dashboard/atoms/ChannelFilterPills'
import { DEMO_DASHBOARD_DATA } from '#/components/dashboard/demo-data'

export const Route = createFileRoute('/')({
  component: Home,
})

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

type DemoTab = 'inbounds' | 'outbound' | 'subreddits' | 'mentions' | 'alerts' | 'settings'

function DemoDashboard({
  tab,
  onTabChange,
}: {
  tab: DemoTab
  onTabChange: (tab: DemoTab) => void
}) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey>('reddit')
  const [demoName, setDemoName] = useState(DEMO_DASHBOARD_DATA.name)
  const [demoUrl, setDemoUrl] = useState(DEMO_DASHBOARD_DATA.url)
  const [demoDescription, setDemoDescription] = useState(DEMO_DASHBOARD_DATA.description)
  const [demoAudience, setDemoAudience] = useState(DEMO_DASHBOARD_DATA.targetAudience)
  const [demoKeywords, setDemoKeywords] = useState(DEMO_DASHBOARD_DATA.keywords.join(', '))
  const [demoSaved, setDemoSaved] = useState(false)
  const [demoNotifyInbounds, setDemoNotifyInbounds] = useState(true)
  const [demoNotifyOutbound, setDemoNotifyOutbound] = useState(true)
  const [demoChannels, setDemoChannels] = useState<string[]>(['Email'])
  const [demoCustomChannel, setDemoCustomChannel] = useState('')
  const [demoAlertsSaved, setDemoAlertsSaved] = useState(false)

  // Per-channel counts computed from the static snapshot - no fetching
  const counts = useMemo(() => {
    const c: Record<ChannelKey, number> = { reddit: 0, twitter: 0, linkedin: 0 }
    for (const t of DEMO_DASHBOARD_DATA.threads) {
      if (t.channel === 'reddit' || t.channel === 'twitter' || t.channel === 'linkedin') c[t.channel]++
    }
    return c
  }, [])

  // Filter the in-memory snapshot client-side (mirrors backend listThreads ordering)
  const threads = useMemo(() => {
    const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return DEMO_DASHBOARD_DATA.threads
      .filter((t) => t.isDone === (activeTab === 'completed'))
      .filter((t) => t.channel === selectedChannel)
      .sort(
        (a, b) =>
          (priorityRank[a.priority ?? 'medium'] ?? 1) - (priorityRank[b.priority ?? 'medium'] ?? 1) ||
          b.redditCreatedAt.getTime() - a.redditCreatedAt.getTime(),
      )
  }, [activeTab, selectedChannel])

  const tabs: { key: DemoTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'inbounds', label: 'Inbounds', icon: RiInboxLine },
    { key: 'outbound', label: 'Outbound', icon: RiSendPlaneLine },
    { key: 'subreddits', label: 'Subreddits', icon: RiRedditLine },
    { key: 'mentions', label: 'Mentions', icon: RiBellLine },
    { key: 'alerts', label: 'Alerts', icon: RiNotification3Line },
    { key: 'settings', label: 'Settings', icon: RiSettingsLine },
  ]

  return (
    <div className="min-h-[520px]">
      {/* Demo tab bar */}
      <div className="flex items-center gap-1 border-b border-[#F0DDD7] px-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={[
              '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-3 text-[13px] font-semibold transition-colors',
              tab === t.key
                ? 'border-[#FF6F59] text-[#332A28]'
                : 'border-transparent text-[#AA9690] hover:text-[#332A28]',
            ].join(' ')}
          >
            <t.icon className="text-sm" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-h-[560px] overflow-y-auto">
        {tab === 'inbounds' && (
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Inbounds</h1>
                <p className="mt-1 text-sm text-muted">
                  Monitored buying-intent posts & questions across Reddit, X, and LinkedIn
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as 'active' | 'completed')}
                variant="underlined"
                color="primary"
                classNames={{
                  tabList: 'gap-6',
                  cursor: 'bg-coral',
                  tab: 'px-0 font-medium',
                }}
              >
                <Tab key="active" title="Active Leads" />
                <Tab key="completed" title="Completed" />
              </Tabs>

              <ChannelFilterPills counts={counts} selected={selectedChannel} onSelect={setSelectedChannel} />
            </div>

            {threads.length === 0 ? (
              <EmptyState
                icon={<RiInboxLine className="text-2xl" />}
                title={activeTab === 'completed' ? 'No completed leads yet' : 'No active leads found'}
                description={
                  activeTab === 'completed'
                    ? 'Leads marked as completed appear here.'
                    : 'Fetch Now scans Reddit, X, and LinkedIn for buying intent conversations.'
                }
              />
            ) : (
              <div className="space-y-4">
                {threads.slice(0, 5).map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} readOnly />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'outbound' && (
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-ink">Outbound Post Generator</h1>
              <p className="mt-1 text-sm text-muted">
                Generate value-first social media posts that naturally feature your SaaS product without triggering ban filters.
              </p>
            </div>
            <EmptyState
              icon={<RiSendPlaneLine className="text-2xl" />}
              title="No drafts generated yet"
              description="Drafts you generate with the Outbound Post Generator will appear here."
            />
          </div>
        )}

        {tab === 'subreddits' && (
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-ink">Subreddit Communities</h1>
              <p className="mt-1 text-sm text-muted">
                Monitored target subreddits for {DEMO_DASHBOARD_DATA.name}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {DEMO_DASHBOARD_DATA.subreddits.map((sub) => (
                <SubredditCard key={sub.id} subreddit={sub} />
              ))}
            </div>
          </div>
        )}

        {tab === 'mentions' && (
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-ink">Brand Mentions</h1>
              <p className="mt-1 text-sm text-muted">
                Discover what people are talking about {DEMO_DASHBOARD_DATA.name} across socials - auto-categorized so you never miss a signal.
              </p>
            </div>
<div className="mb-8 overflow-hidden rounded-2xl border border-coral/20 bg-gradient-to-br from-coral/10 via-white to-purple-100/40 p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                    <RiVoiceprintLine className="text-3xl" />
                  </div>
                  <span className="mb-3 rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral-dark">
                    Coming Soon
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-ink">
                    Brand mentions radar is on the way
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    We're scanning Reddit, X, and LinkedIn for conversations about {DEMO_DASHBOARD_DATA.name}. When someone
                    is discussing a bug, asking for a feature, or singing your praises - you'll see it here,
                    auto-tagged into categories.
                  </p>
                </div>
              </div>
            </div>
        )}

        {tab === 'settings' && (
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
              <p className="mt-1 text-sm text-muted">Project context - what OpenCMO knows about your product</p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setDemoSaved(true)
                  setTimeout(() => setDemoSaved(false), 3000)
                }}
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-faint">
                      Product Name
                    </label>
                    <input
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      className="control-outline w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-faint">
                      Product URL
                    </label>
                    <input
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      className="control-outline w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-faint">
                    Description
                  </label>
                  <textarea
                    value={demoDescription}
                    onChange={(e) => setDemoDescription(e.target.value)}
                    rows={3}
                    className="control-outline w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-faint">
                    Target Audience
                  </label>
                  <textarea
                    value={demoAudience}
                    onChange={(e) => setDemoAudience(e.target.value)}
                    rows={2}
                    className="control-outline w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-faint">
                    Keywords
                  </label>
                  <input
                    value={demoKeywords}
                    onChange={(e) => setDemoKeywords(e.target.value)}
                    placeholder="saas, cold email, solopreneur"
                    className="control-outline w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                </div>

                {demoSaved && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-600">
                    <RiCheckLine className="text-base" /> Project context saved (preview)
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="rounded-full bg-coral px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
                  >
                    Save Project Context
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'alerts' && (
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-ink">Alerts</h1>
              <p className="mt-1 text-sm text-muted">
                Get notified as soon as someone shares a problem your product solves.
              </p>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-card p-6">
                <h2 className="font-semibold text-ink">Notifications</h2>
                <p className="mt-1 text-xs text-muted">
                  Choose what you want to be notified about, and which channels to use.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-sand/60 p-4">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={demoNotifyInbounds}
                        onChange={(e) => setDemoNotifyInbounds(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#FF6F59]"
                      />
                      Inbound leads
                    </label>
                    <p className="mt-1 text-xs text-muted">High buying-intent threads found for your products.</p>
                  </div>
                  <div className="rounded-xl border border-line bg-sand/60 p-4">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={demoNotifyOutbound}
                        onChange={(e) => setDemoNotifyOutbound(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#FF6F59]"
                      />
                      Outbound drafts
                    </label>
                    <p className="mt-1 text-xs text-muted">When your daily content batch is ready to review and post.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-card p-6">
                <div className="flex items-center gap-2">
                  <RiNotification3Line className="text-lg text-coral" />
                  <div>
                    <h2 className="font-semibold text-ink">Request more channels</h2>
                    <p className="mt-1 text-xs text-muted">
                      Want alerts somewhere besides email? Tell us which channels to add.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { key: 'Email', icon: RiMailLine },
                    { key: 'WhatsApp', icon: FaWhatsapp },
                    { key: 'Slack', icon: SiSlack },
                    { key: 'Discord', icon: SiDiscord },
                  ].map((channel) => {
                    const active = demoChannels.includes(channel.key)
                    return (
                      <button
                        key={channel.key}
                        type="button"
                        onClick={() =>
                          setDemoChannels((prev) =>
                            prev.includes(channel.key) ? prev.filter((c) => c !== channel.key) : [...prev, channel.key],
                          )
                        }
                        className={[
                          'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                          active
                            ? 'border-transparent bg-[#FF6F59] text-white'
                            : 'border-[#E9D4CD] bg-white text-[#756661] hover:border-[#E0C4BC]',
                        ].join(' ')}
                      >
                        <channel.icon className="text-sm" /> {channel.key}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    value={demoCustomChannel}
                    onChange={(e) => setDemoCustomChannel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const name = demoCustomChannel.trim()
                        if (name && !demoChannels.includes(name)) setDemoChannels((prev) => [...prev, name])
                        setDemoCustomChannel('')
                      }
                    }}
                    placeholder="Or type a custom channel (e.g. Telegram, SMS)"
                    className="control-outline w-full max-w-md rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const name = demoCustomChannel.trim()
                      if (name && !demoChannels.includes(name)) setDemoChannels((prev) => [...prev, name])
                      setDemoCustomChannel('')
                    }}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-coral/10 text-coral transition hover:bg-coral/20"
                    aria-label="Add custom channel"
                  >
                    <RiSendPlaneLine className="text-base" />
                  </button>
                </div>

                {demoChannels.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {demoChannels.map((channel) => (
                      <span
                        key={channel}
                        className="flex items-center gap-1.5 rounded-full bg-coral/10 px-3 py-1 text-xs font-medium text-coral-dark"
                      >
                        {channel}
                        <button
                          type="button"
                          onClick={() => setDemoChannels((prev) => prev.filter((c) => c !== channel))}
                          className="cursor-pointer text-coral-dark/70 hover:text-coral-dark"
                          aria-label={`Remove ${channel}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {demoAlertsSaved && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-600">
                  <RiCheckLine className="text-base" /> Alert preferences saved (preview)
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDemoAlertsSaved(true)
                    setTimeout(() => setDemoAlertsSaved(false), 3000)
                  }}
                  className="cursor-pointer rounded-full bg-coral px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
                >
                  Save Alert Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logosDropped, setLogosDropped] = useState(false)
  const [redditDropped, setRedditDropped] = useState(false)
  const [demoTab, setDemoTab] = useState<DemoTab>('inbounds')
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
              <DemoDashboard tab={demoTab} onTabChange={setDemoTab} />
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
          <PricingSection />
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