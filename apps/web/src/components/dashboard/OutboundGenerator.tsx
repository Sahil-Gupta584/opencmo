import { Card, CardBody, Chip, Spinner, Tabs, Tab } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useState } from 'react'
import { RiFileCopyLine, RiCheckLine, RiArticleLine, RiHashtag } from 'react-icons/ri'

interface OutboundGeneratorProps {
  activeProjectId: string
  isDemo?: boolean
}

export function OutboundGenerator({ activeProjectId, isDemo = false }: OutboundGeneratorProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'SOCIAL' | 'ARTICLE'>('SOCIAL')

  const api = isDemo ? orpc.demo : orpc

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    ...api.listProjects.queryOptions(),
    staleTime: 0,
  })

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]
  const isGenerating = !!activeProject?.isGeneratingContent
  const drafts = activeProject?.drafts || []

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loadingProjects) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const sorted = [...drafts].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const todayDrafts = sorted.filter((d: any) => new Date(d.createdAt) >= todayStart)
  const historyDrafts = sorted.filter((d: any) => new Date(d.createdAt) < todayStart)

  const todayByType = (type: 'SOCIAL' | 'ARTICLE') => todayDrafts.filter((d: any) => d.type === type)
  const historyByType = (type: 'SOCIAL' | 'ARTICLE') => historyDrafts.filter((d: any) => d.type === type)

  const groupedByDay = historyByType(typeFilter).reduce<Record<string, any[]>>((acc, d: any) => {
    const date = new Date(d.createdAt)
    date.setHours(0, 0, 0, 0)
    const key = date.toISOString()
    acc[key] = acc[key] || []
    acc[key].push(d)
    return acc
  }, {})

  const DraftCard = ({ draft }: { draft: any }) => (
    <Card className="card-surface" radius="lg">
      <CardBody className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Chip size="sm" variant="flat" color={draft.type === 'ARTICLE' ? 'primary' : 'success'} className="font-semibold">
            {draft.type === 'ARTICLE' ? 'Article' : 'Social'}
          </Chip>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            onClick={() => handleCopy(draft.id, `${draft.title ?? ''}\n\n${draft.content}`.trim())}
          >
            {copiedId === draft.id ? <RiCheckLine /> : <RiFileCopyLine />}
            {copiedId === draft.id ? 'Copied!' : 'Copy Post'}
          </button>
        </div>

        {draft.title && <h3 className="text-base font-bold text-ink">{draft.title}</h3>}
        <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap bg-sand p-4 rounded-xl border border-line">
          {draft.content}
        </p>
      </CardBody>
    </Card>
  )

  const EmptySection = ({ type }: { type: 'SOCIAL' | 'ARTICLE' }) => {
    const isArticle = type === 'ARTICLE'
    return (
      <div className="flex flex-col items-center justify-center card-surface py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10 text-coral">
          {isArticle ? <RiArticleLine className="text-2xl" /> : <RiHashtag className="text-2xl" />}
        </div>
        <h3 className="text-base font-semibold text-ink mb-1">
          {isArticle ? 'No article generated yet' : 'No social posts generated yet'}
        </h3>
        <p className="text-sm text-muted max-w-xs">
          {isArticle
            ? 'OpenCMO writes 1 article every day. Check back after generation runs.'
            : 'OpenCMO writes 3 social posts every day. Check back after generation runs.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Outbound Content</h1>
        <p className="mt-1 text-sm text-muted">
          OpenCMO writes 3 social posts and 1 article for you every day - value-first content that naturally features your product.
        </p>
      </div>

      {/* Generating banner */}
      {isGenerating && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-ink">Generating today's content…</p>
        </div>
      )}

      {/* Today's content */}
      <div className="mb-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Today's Content</h2>
          {todayDrafts.length > 0 && (
            <Chip size="sm" variant="flat" color="success" className="font-semibold">
              Go post them now
            </Chip>
          )}
        </div>

        <Tabs
          selectedKey={typeFilter}
          onSelectionChange={(key) => setTypeFilter(key as 'SOCIAL' | 'ARTICLE')}
          variant="underlined"
          color="primary"
          classNames={{
            tabList: 'gap-6',
            cursor: 'bg-coral',
            tab: 'px-0 font-medium',
          }}
        >
          <Tab key="SOCIAL" title="Social Posts" />
          <Tab key="ARTICLE" title="Article" />
        </Tabs>

        {todayByType(typeFilter).length === 0 ? (
          <EmptySection type={typeFilter} />
        ) : (
          <div className="space-y-4">
            {todayByType(typeFilter).map((draft: any) => (
              <DraftCard key={draft.id} draft={draft} />
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {historyByType(typeFilter).length > 0 && (
        <div className="space-y-8">
          <h2 className="text-lg font-bold text-ink">Previous Content</h2>
          {Object.entries(groupedByDay)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dayKey, dayDrafts]) => (
              <div key={dayKey} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  {new Date(dayKey).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
                {dayDrafts.map((draft: any) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}