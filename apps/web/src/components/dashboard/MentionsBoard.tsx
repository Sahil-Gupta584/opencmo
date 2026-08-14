import { Button, Chip, Spinner } from '@heroui/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useState } from 'react'
import {
  RiVoiceprintLine,
  RiBugLine,
  RiLightbulbLine,
  RiHeartLine,
  RiSearchEyeLine,
  RiCheckLine,
} from 'react-icons/ri'

interface MentionsBoardProps {
  activeProjectId?: string
}

const CATEGORIES = [
  { icon: RiBugLine, label: 'Bug reports', color: '#f55d47' },
  { icon: RiLightbulbLine, label: 'Feature requests', color: '#b98bde' },
  { icon: RiHeartLine, label: 'Praise & love', color: '#10a37f' },
]

export function MentionsBoard({ activeProjectId }: MentionsBoardProps) {
  const { data: projects = [], isLoading } = useQuery({
    ...orpc.listProjects.queryOptions(),
    staleTime: 0,
  })

  const { data: interest } = useQuery({
    ...orpc.getMentionsInterest.queryOptions({ input: { feature: 'mentions' } }),
    staleTime: 0,
  })

  const saveInterestMutation = useMutation(
    orpc.saveMentionsInterest.mutationOptions({
      onError: (err) => {
        console.error('🔴 Failed to save mentions interest:', err)
      },
    }),
  )

  const projectName =
    projects.find((p) => p.id === activeProjectId)?.name || projects[0]?.name || 'your brand'

  const interested = interest?.interested
  const answered = interested === true || interested === false

  const handleAnswer = (answer: boolean) => {
    saveInterestMutation.mutate({ feature: 'mentions', interested: answer })
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Brand Mentions</h1>
        <p className="mt-1 text-sm text-muted">
          Discover what people are talking about {projectName} across socials - auto-categorized so you never miss a signal.
        </p>
      </div>

      {/* Coming soon banner */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-coral/20 bg-gradient-to-br from-coral/10 via-white to-purple-100/40 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/10 text-coral">
            <RiVoiceprintLine className="text-3xl" />
          </div>
          <Chip
            size="sm"
            variant="flat"
            classNames={{ base: 'bg-coral/10 mb-3', content: 'text-coral-dark font-semibold text-xs' }}
          >
            Coming Soon
          </Chip>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Brand mentions radar is on the way
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            We're scanning Reddit, X, and LinkedIn for conversations about {projectName}. When someone
            is discussing a bug, asking for a feature, or singing your praises - you'll see it here,
            auto-tagged into categories.
          </p>

          {answered ? (
            <div className="mt-5 flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <RiCheckLine className="text-base" />
              {interested ? "You're on the interest list - we'll notify you when Mentions launches." : 'Got it - thanks for the feedback!'}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-ink">Interested in this feature?</p>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  color="primary"
                  variant="solid"
                  isLoading={saveInterestMutation.isPending}
                  onPress={() => handleAnswer(true)}
                  className="bg-coral font-semibold"
                >
                  Yes, I'm interested
                </Button>
                <Button
                  size="sm"
                  variant="bordered"
                  isLoading={saveInterestMutation.isPending}
                  onPress={() => handleAnswer(false)}
                  className="font-medium"
                >
                  Not interested
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category preview */}
      <div className="mb-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">
          Mentions are auto-tagged into categories like
        </h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.label}
              variant="flat"
              classNames={{
                base: 'bg-white border border-line',
                content: 'text-sm font-medium flex items-center gap-1.5',
              }}
            >
              <cat.icon style={{ color: cat.color }} className="text-base" /> {cat.label}
            </Chip>
          ))}
          <Chip
            variant="flat"
            classNames={{
              base: 'bg-white border border-dashed border-line-strong',
              content: 'text-sm font-medium text-muted flex items-center gap-1.5',
            }}
          >
            <RiSearchEyeLine className="text-base text-muted" /> and more
          </Chip>
        </div>
      </div>

      {/* What it does */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Monitor',
            desc: 'Listen across Reddit, X, and LinkedIn for any mention of your product.',
          },
          {
            title: 'Categorize',
            desc: 'AI sorts each mention into clear buckets - "found a bug", "want this feature", "love it!".',
          },
          {
            title: 'Act',
            desc: 'Jump into the conversation fast with one click - before it goes cold.',
          },
        ].map((step) => (
          <div key={step.title} className="card-surface rounded-xl p-5">
            <h4 className="text-sm font-bold text-ink">{step.title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}