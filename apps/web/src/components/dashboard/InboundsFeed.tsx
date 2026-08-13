import {
  Button,
  Spinner,
  Tabs,
  Tab,
} from '@heroui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useState } from 'react'
import {
  RiRefreshLine,
  RiInboxLine,
} from 'react-icons/ri'
import { ThreadCard } from './atoms/ThreadCard'
import { ChannelFilterPills, type ChannelKey } from './atoms/ChannelFilterPills'
import { EmptyState } from './atoms/EmptyState'

interface InboundsFeedProps {
  activeProjectId: string
}

export function InboundsFeed({ activeProjectId }: InboundsFeedProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey>('reddit')

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
            startContent={<RiRefreshLine />}
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
        <ChannelFilterPills
          counts={{ reddit: threadCounts?.reddit ?? 0, twitter: threadCounts?.twitter ?? 0, linkedin: threadCounts?.linkedin ?? 0 }}
          selected={selectedChannel}
          onSelect={setSelectedChannel}
        />
      </div>

      {/* ── Threads Feed ────────────────────────────────────────────────── */}
      {loadingThreads ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : threads.length === 0 ? (
        <EmptyState
          icon={<RiInboxLine className="text-2xl" />}
          title={activeTab === 'completed' ? 'No completed leads yet' : 'No active leads found'}
          description={
            activeTab === 'completed'
              ? 'Leads you mark as completed will appear here.'
              : 'Click "Fetch Now" to scan Reddit, X, and LinkedIn for buying intent conversations.'
          }
        />
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => {
            const isReplying = generateReplyMutation.isPending && generateReplyMutation.variables?.threadId === thread.id
            const isUpdating = updateStatusMutation.isPending && updateStatusMutation.variables?.threadId === thread.id

            return (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isReplying={isReplying}
                isUpdating={isUpdating}
                onGenerateReply={(t) => generateReplyMutation.mutate({ threadId: t.id })}
                onToggleStatus={(t) => updateStatusMutation.mutate({ threadId: t.id, isDone: !t.isDone })}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}