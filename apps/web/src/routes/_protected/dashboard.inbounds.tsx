import { createFileRoute } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Spinner,
  Tabs,
  Tab,
} from '@heroui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useState } from 'react'
import { getActiveProjectId } from '#/lib/active-project'
import {
  RiRefreshLine,
  RiExternalLinkLine,
  RiCheckLine,
  RiFileCopyLine,
  RiMagicLine,
  RiInboxLine,
  RiRedditLine,
  RiTimeLine,
  RiUserLine,
  RiTwitterXLine,
  RiLinkedinBoxLine,
} from 'react-icons/ri'

export const Route = createFileRoute('/_protected/dashboard/inbounds')({
  component: InboundsPage,
})

function InboundsPage() {
  const queryClient = useQueryClient()
  const activeProjectId = getActiveProjectId() || ''
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedChannel, setSelectedChannel] = useState<'reddit' | 'twitter' | 'linkedin'>('reddit')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch active project's isFetching flag so we can show fetch progress
  const { data: projects = [] } = useQuery({
    ...orpc.listProjects.queryOptions(),
    refetchInterval: 4000,
  })
  const activeProject = projects.find((p) => p.id === activeProjectId)
  const isFetching = Boolean(activeProject?.isFetching)

  // Fetch threads for active project
  const { data: threads = [], isLoading: loadingThreads } = useQuery({
    ...orpc.listThreads.queryOptions({
      input: { projectId: activeProjectId, isDone: activeTab === 'completed', channel: selectedChannel },
    }),
    enabled: !!activeProjectId,
  })

  // Per-channel counts for the filter pills
  const { data: threadCounts } = useQuery({
    ...orpc.listThreadCounts.queryOptions({
      input: { projectId: activeProjectId },
    }),
    enabled: !!activeProjectId,
  })

  // Mutations
  const fetchInboundsMutation = useMutation(
    orpc.fetchInbounds.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries()
      },
      onError: (err) => {
        console.error('🔴 Failed to fetch inbounds:', err)
      },
    }),
  )

  const updateStatusMutation = useMutation(
    orpc.updateThreadStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries()
      },
    }),
  )

  const generateReplyMutation = useMutation(
    orpc.generateThreadReply.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries()
      },
    }),
  )

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Inbounds</h1>
          <p className="mt-1 text-sm text-muted">
            Monitored buying-intent posts & questions across Reddit, X, and LinkedIn
          </p>
        </div>

        {/* Fetch Button */}
        <div className="flex items-center gap-3">
          <Button
            color="primary"
            startContent={
              fetchInboundsMutation.isPending ? (
                <Spinner size="sm" color="current" />
              ) : (
                <RiRefreshLine />
              )
            }
            isLoading={fetchInboundsMutation.isPending}
            onPress={() => activeProjectId && fetchInboundsMutation.mutate({ projectId: activeProjectId })}
            className="font-medium"
            isDisabled={!activeProjectId}
          >
            {fetchInboundsMutation.isPending ? 'Fetching...' : 'Fetch Now'}
          </Button>
        </div>
      </div>

      {/* ── Fetching Banner ─────────────────────────────────────────────── */}
      {isFetching && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3">
          <Spinner size="sm" color="primary" />
          <p className="text-sm font-medium text-coral-dark">
            Fetching new leads for this product… we'll show them here as soon as the scan finishes.
          </p>
        </div>
      )}

      {/* ── Filters & Tabs ──────────────────────────────────────────────── */}
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

        {/* Channel Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={selectedChannel === 'reddit' ? 'solid' : 'flat'}
            color={selectedChannel === 'reddit' ? 'primary' : 'default'}
            startContent={
              <RiRedditLine className={`text-xs ${selectedChannel === 'reddit' ? 'text-white' : 'text-orange-500'}`} />
            }
            onPress={() => setSelectedChannel('reddit')}
            className="font-medium text-xs h-8"
          >
            Reddit{threadCounts?.reddit ? ` (${threadCounts.reddit})` : ''}
          </Button>
          <Button
            size="sm"
            variant={selectedChannel === 'twitter' ? 'solid' : 'flat'}
            color={selectedChannel === 'twitter' ? 'primary' : 'default'}
            startContent={
              <RiTwitterXLine className={`text-xs ${selectedChannel === 'twitter' ? 'text-white' : 'text-ink'}`} />
            }
            onPress={() => setSelectedChannel('twitter')}
            className="font-medium text-xs h-8"
          >
            X (Twitter){threadCounts?.twitter ? ` (${threadCounts.twitter})` : ''}
          </Button>
          <Button
            size="sm"
            variant={selectedChannel === 'linkedin' ? 'solid' : 'flat'}
            color={selectedChannel === 'linkedin' ? 'primary' : 'default'}
            startContent={
              <RiLinkedinBoxLine className={`text-xs ${selectedChannel === 'linkedin' ? 'text-white' : 'text-blue-600'}`} />
            }
            onPress={() => setSelectedChannel('linkedin')}
            className="font-medium text-xs h-8"
          >
            LinkedIn{threadCounts?.linkedin ? ` (${threadCounts.linkedin})` : ''}
          </Button>
        </div>
      </div>

      {/* ── Threads Feed ────────────────────────────────────────────────── */}
      {loadingThreads ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center card-surface py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10 text-coral">
            <RiInboxLine className="text-2xl" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1">
            {activeTab === 'completed' ? 'No completed leads yet' : 'No active leads found'}
          </h3>
          <p className="text-sm text-muted mb-6 max-w-sm">
            {activeTab === 'completed'
              ? 'Leads you mark as completed will appear here.'
              : 'Click "Fetch Now" to scan Reddit, X, and LinkedIn for buying intent conversations.'}
          </p>
          {activeTab === 'active' && (
            <Button
              color="primary"
              startContent={<RiRefreshLine />}
              isLoading={fetchInboundsMutation.isPending}
              onPress={() => activeProjectId && fetchInboundsMutation.mutate({ projectId: activeProjectId })}
            >
              Fetch Now
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread: any) => {
            const isReplying = generateReplyMutation.isPending && generateReplyMutation.variables?.threadId === thread.id
            const isUpdating = updateStatusMutation.isPending && updateStatusMutation.variables?.threadId === thread.id

            return (
              <Card key={thread.id} className="card-surface card-surface-hover" radius="lg">
                <CardBody className="p-5 space-y-4">
                  {/* Top metadata */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-faint">
                    <div className="flex items-center gap-2">
                      {thread.priority === 'high' && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="danger"
                          classNames={{ content: 'font-semibold text-xs' }}
                        >
                          High
                        </Chip>
                      )}
                      {thread.priority === 'medium' && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="warning"
                          classNames={{ content: 'font-semibold text-xs' }}
                        >
                          Medium
                        </Chip>
                      )}
                      {thread.priority === 'low' && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="default"
                          classNames={{ content: 'font-semibold text-xs' }}
                        >
                          Low
                        </Chip>
                      )}
                      {thread.channel === 'twitter' ? (
                        <Chip
                          size="sm"
                          variant="flat"
                          classNames={{ base: 'bg-sand', content: 'text-ink font-medium text-xs flex items-center gap-1' }}
                        >
                          <RiTwitterXLine className="text-ink" /> X (Twitter)
                        </Chip>
                      ) : thread.channel === 'linkedin' ? (
                        <Chip
                          size="sm"
                          variant="flat"
                          classNames={{ base: 'bg-blue-50', content: 'text-blue-700 font-medium text-xs flex items-center gap-1' }}
                        >
                          <RiLinkedinBoxLine className="text-blue-600" /> LinkedIn
                        </Chip>
                      ) : (
                        <Chip
                          size="sm"
                          variant="flat"
                          classNames={{ base: 'bg-orange-50', content: 'text-orange-700 font-medium text-xs flex items-center gap-1' }}
                        >
                          <RiRedditLine className="text-orange-500" /> {thread.subreddit}
                        </Chip>
                      )}
                      {thread.author && (
                        <span className="flex items-center gap-1">
                          <RiUserLine /> {thread.author}
                        </span>
                      )}
                      {thread.redditCreatedAt && (
                        <span className="flex items-center gap-1">
                          <RiTimeLine /> {new Date(thread.redditCreatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={thread.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-coral visited:text-purple-600 hover:underline flex items-center gap-1 font-medium no-underline"
                      >
                        View Post <RiExternalLinkLine />
                      </a>
                    </div>
                  </div>

                  {/* Title & snippet */}
                  <div>
                    <h3 className="text-base font-bold text-ink leading-snug">{thread.title}</h3>
                    {thread.body && (
                      <p className="mt-2 text-sm text-muted leading-relaxed bg-sand p-3 rounded-lg border border-line">
                        {thread.body}
                      </p>
                    )}
                  </div>

                  {/* Generated reply */}
                  {thread.generatedReply ? (
                    <div className="space-y-2 rounded-xl bg-coral/10 p-4 border border-coral/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-coral-dark flex items-center gap-1.5">
                          <RiMagicLine /> Generated Reply
                        </span>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="h-7 text-xs font-semibold"
                          startContent={copiedId === thread.id ? <RiCheckLine /> : <RiFileCopyLine />}
                          onPress={() => handleCopy(thread.id, thread.generatedReply)}
                        >
                          {copiedId === thread.id ? 'Copied!' : 'Copy Reply'}
                        </Button>
                      </div>
                      <p className="text-sm text-ink leading-relaxed font-normal">{thread.generatedReply}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-line">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        isLoading={isReplying}
                        startContent={!isReplying && <RiMagicLine />}
                        onPress={() => generateReplyMutation.mutate({ threadId: thread.id })}
                        className="font-semibold"
                      >
                        {isReplying ? 'AI Writing Reply…' : 'Generate Reply'}
                      </Button>

                      <Button
                        size="sm"
                        variant="light"
                        color={thread.isDone ? 'default' : 'success'}
                        isLoading={isUpdating}
                        startContent={!isUpdating && <RiCheckLine />}
                        onPress={() => updateStatusMutation.mutate({ threadId: thread.id, isDone: !thread.isDone })}
                        className="font-medium"
                      >
                        {thread.isDone ? 'Re-open' : 'Mark as Completed'}
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
