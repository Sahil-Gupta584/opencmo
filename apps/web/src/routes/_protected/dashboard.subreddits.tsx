import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, CardBody, Chip, Spinner } from '@heroui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { getActiveProjectId } from '#/lib/active-project'
import { RiRefreshLine, RiShieldCheckLine, RiExternalLinkLine, RiSearchLine } from 'react-icons/ri'

export const Route = createFileRoute('/_protected/dashboard/subreddits')({
  component: SubredditsPage,
})

function SubredditsPage() {
  const queryClient = useQueryClient()
  const activeProjectId = getActiveProjectId() || ''

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
        <div className="flex flex-col items-center justify-center card-surface py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <RiSearchLine className="text-xl" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1">No subreddits analyzed yet</h3>
          <p className="text-sm text-muted mb-4 max-w-xs">
            Click "Rediscover Subreddits" to run AI discovery for your product.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subreddits.map((sub: any) => {
            const cleanName = sub.name.replace(/^r\//, '')
            return (
              <Card key={sub.id} className="card-surface card-surface-hover" radius="lg">
                <CardBody className="p-5 flex flex-col justify-between h-full gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 font-bold text-sm">
                          r/
                        </div>
                        <h3 className="font-bold text-ink text-base">{sub.name}</h3>
                      </div>
                      <a
                        href={`https://reddit.com/r/${cleanName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-coral hover:underline flex items-center gap-1 font-medium no-underline"
                      >
                        Reddit <RiExternalLinkLine />
                      </a>
                    </div>

                    <p className="text-sm text-muted leading-relaxed line-clamp-3">
                      {sub.description || 'Target community for indie hackers, founders, and creators.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted font-medium">
                      <RiShieldCheckLine className="text-faint" />
                      Active community
                    </div>

                    <Chip size="sm" variant="flat" classNames={{ base: 'bg-emerald-50', content: 'text-emerald-700 font-medium text-xs' }}>
                      <span className="flex items-center gap-1">
                        <RiShieldCheckLine /> {sub.relevance || 95}% Relevance
                      </span>
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
