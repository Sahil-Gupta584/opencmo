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
  RiCheckDoubleLine,
} from 'react-icons/ri'
import { ThreadCard } from './atoms/ThreadCard'
import { ChannelFilterPills, type ChannelKey } from './atoms/ChannelFilterPills'
import { EmptyState } from './atoms/EmptyState'

interface InboundsFeedProps {
  activeProjectId: string
}

export function InboundsFeed({ activeProjectId }: InboundsFeedProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'dismissed'>('active')
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey>('reddit')

  const { data: projects = [] } = useQuery({
    ...orpc.listProjects.queryOptions(),
    refetchInterval: 4000,
  })

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0]
  const resolvedProjectId = activeProject?.id ?? ''
  const isFetching = Boolean(activeProject?.isFetching)

  const { data: threads = [], isLoading: loadingThreads } = useQuery({
    ...orpc.listThreads.queryOptions({
      input: {
        projectId: resolvedProjectId,
        isDone: activeTab === 'completed',
        isDismissed: activeTab === 'dismissed',
        channel: selectedChannel,
      },
    }),
    enabled: !!resolvedProjectId,
  })

  const { data: threadCounts } = useQuery({
    ...orpc.listThreadCounts.queryOptions({
      input: { projectId: resolvedProjectId },
    }),
    enabled: !!resolvedProjectId,
  })

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

  const markCompleteMutation = useMutation(
    orpc.markThreadsComplete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries()
      },
      onError: (err) => {
        console.error('🔴 Failed to mark threads complete:', err)
      },
    }),
  )

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Inbounds</h1>
          <p className="mt-1 text-sm text-muted">
            Monitored buying-intent posts & questions across Reddit, X, and LinkedIn
          </p>
        </div>

         <div className="flex items-center gap-3">
          <Button
            color="primary"
            startContent={<RiRefreshLine />}
            isLoading={fetchInboundsMutation.isPending}
            onPress={() => resolvedProjectId && fetchInboundsMutation.mutate({ projectId: resolvedProjectId })}
            className="font-medium"
            isDisabled={!resolvedProjectId}
          >
            {fetchInboundsMutation.isPending ? 'Fetching...' : 'Fetch Now'}
          </Button>
        </div>
      </div>

      {isFetching && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3">
          <Spinner size="sm" color="primary" />
          <p className="text-sm font-medium text-coral-dark">
            Fetching new leads for this product… we'll notify you as soon we find leads.
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as 'active' | 'completed' | 'dismissed')}
          variant="underlined"
          color="primary"
          classNames={{
            tabList: 'gap-6',
            cursor: 'bg-coral',
            tab: 'px-0 font-medium',
          }}
        >
          <Tab key="active" title={`Active (${threadCounts?.active[selectedChannel] ?? 0})`} />
          <Tab key="completed" title={`Completed (${threadCounts?.completed[selectedChannel] ?? 0})`} />
          <Tab key="dismissed" title={`Dismissed (${threadCounts?.dismissed[selectedChannel] ?? 0})`} />
        </Tabs>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <ChannelFilterPills
            counts={{ reddit: threadCounts?.reddit ?? 0, twitter: threadCounts?.twitter ?? 0, linkedin: threadCounts?.linkedin ?? 0 }}
            selected={selectedChannel}
            onSelect={setSelectedChannel}
          />

          {activeTab === 'active' && threads.length > 0 && (
            <Button
              size="sm"
              variant="flat"
              color="success"
              startContent={<RiCheckDoubleLine className="text-sm" />}
              isLoading={markCompleteMutation.isPending}
              isDisabled={markCompleteMutation.isPending}
              onPress={() =>
                activeProjectId &&
                markCompleteMutation.mutate({
                  projectId: activeProjectId,
                  channel: selectedChannel,
                  threadIds: threads.map((t) => t.id),
                })
              }
              className="h-8 font-medium text-xs"
            >
              Mark all as complete
            </Button>
          )}
        </div>
      </div>

      {loadingThreads ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : threads.length === 0 ? (
        <EmptyState
          icon={<RiInboxLine className="text-2xl" />}
          title={activeTab === 'completed' ? 'No completed leads yet' : activeTab === 'dismissed' ? 'No dismissed leads' : 'No active leads found'}
          description={
            activeTab === 'completed'
              ? 'Leads you mark as completed will appear here.'
              : activeTab === 'dismissed'
              ? 'Leads you dismiss will appear here.'
              : 'We fetch leads in batches every 6 hours. You will get notified through Alerts!'
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
                onDismiss={(t) => updateStatusMutation.mutate({ threadId: t.id, isDismissed: true })}
                onRestore={(t) => updateStatusMutation.mutate({ threadId: t.id, isDismissed: false })}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
