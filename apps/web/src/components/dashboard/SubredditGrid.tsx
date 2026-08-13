import { Button, Spinner } from '@heroui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { RiRefreshLine, RiSearchLine } from 'react-icons/ri'
import { SubredditCard } from './atoms/SubredditCard'
import { EmptyState } from './atoms/EmptyState'

interface SubredditGridProps {
  activeProjectId: string
}

export function SubredditGrid({ activeProjectId }: SubredditGridProps) {
  const queryClient = useQueryClient()

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    ...orpc.listProjects.queryOptions(),
    staleTime: 0,
  })

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]

  const refreshSubredditsMutation = useMutation(
    orpc.refreshSubreddits.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries()
      },
    }),
  )

  if (loadingProjects) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const subreddits = activeProject?.subreddits || []

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Subreddit Communities</h1>
          <p className="mt-1 text-sm text-muted">
            Monitored target subreddits for {activeProject?.name || 'your SaaS'}
          </p>
        </div>

        <Button
          color="primary"
          startContent={
            refreshSubredditsMutation.isPending ? <Spinner size="sm" color="current" /> : <RiRefreshLine />
          }
          isLoading={refreshSubredditsMutation.isPending}
          onPress={() => activeProjectId && refreshSubredditsMutation.mutate({ projectId: activeProjectId })}
          className="font-medium"
          isDisabled={!activeProjectId}
        >
          {refreshSubredditsMutation.isPending ? 'Discovering...' : 'Rediscover Subreddits'}
        </Button>
      </div>

      {/* Subreddit Cards Grid */}
      {subreddits.length === 0 ? (
        <EmptyState
          iconWrapperClassName="bg-orange-50 text-orange-600"
          icon={<RiSearchLine className="text-xl" />}
          title="No subreddits analyzed yet"
          description='Click "Rediscover Subreddits" to run AI discovery for your product.'
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subreddits.map((sub) => (
            <SubredditCard key={sub.id} subreddit={sub} />
          ))}
        </div>
      )}
    </div>
  )
}