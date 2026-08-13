import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, CardBody, Chip, Spinner } from '@heroui/react'
import { Select, SelectItem } from '#/components/Select'
import { Textarea } from '#/components/Textarea'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useState } from 'react'
import { getActiveProjectId } from '#/lib/active-project'
import { RiSendPlaneLine, RiMagicLine, RiFileCopyLine, RiCheckLine } from 'react-icons/ri'

export const Route = createFileRoute('/_protected/dashboard/outbound')({
  component: OutboundPage,
})

function OutboundPage() {
  const queryClient = useQueryClient()
  const activeProjectId = getActiveProjectId() || ''
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch projects to get subreddits for selected project
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    ...orpc.listProjects.queryOptions(),
    staleTime: 0,
  })

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]
  const subreddits = activeProject?.subreddits || []

  // Mutation to generate draft
  const generateDraftMutation = useMutation(
    orpc.generateDraft.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries()
        setCustomPrompt('')
      },
      onError: (err) => {
        console.error('🔴 Failed to generate draft:', err)
      },
    }),
  )

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

  const drafts = activeProject?.drafts || []

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Outbound Post Generator</h1>
        <p className="mt-1 text-sm text-muted">
          Generate value-first Reddit posts that naturally feature your SaaS product without triggering ban filters.
        </p>
      </div>

      {/* Generator Card */}
      <Card className="mb-8 card-surface" radius="lg">
        <CardBody className="p-6 space-y-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <RiMagicLine className="text-coral" /> Create New Post Draft
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Target Subreddit
              </label>
              <Select
                placeholder="Select a subreddit"
                selectedKeys={selectedSubreddit ? [selectedSubreddit] : []}
                onChange={(e) => setSelectedSubreddit(e.target.value)}
                aria-label="Target subreddit"
              >
                {subreddits.map((sub: any) => (
                  <SelectItem key={sub.name}>{sub.name}</SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Angle / Topic (Optional)
              </label>
              <Textarea
                placeholder="e.g. How we grew to $2k MRR using organic Reddit leads..."
                minRows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              color="primary"
              size="lg"
              className="font-semibold"
              isDisabled={!selectedSubreddit || generateDraftMutation.isPending}
              isLoading={generateDraftMutation.isPending}
              startContent={!generateDraftMutation.isPending && <RiSendPlaneLine />}
              onPress={() =>
                generateDraftMutation.mutate({
                  projectId: activeProjectId,
                  subreddit: selectedSubreddit,
                  prompt: customPrompt,
                })
              }
            >
              {generateDraftMutation.isPending ? 'Generating Draft…' : 'Generate Post Draft'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Drafts Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Generated Drafts ({drafts.length})</h2>

        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center card-surface py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10 text-coral">
              <RiSendPlaneLine className="text-2xl" />
            </div>
            <h3 className="text-base font-semibold text-ink mb-1">No drafts generated yet</h3>
            <p className="text-sm text-muted max-w-xs">
              Select a subreddit above to generate your first value-first Reddit post draft.
            </p>
          </div>
        ) : (
          drafts.map((draft: any) => (
            <Card key={draft.id} className="card-surface" radius="lg">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Chip size="sm" variant="flat" color="warning" className="font-semibold">
                    {draft.subreddit}
                  </Chip>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={copiedId === draft.id ? <RiCheckLine /> : <RiFileCopyLine />}
                    onPress={() => handleCopy(draft.id, `${draft.title}\n\n${draft.content}`)}
                  >
                    {copiedId === draft.id ? 'Copied!' : 'Copy Post'}
                  </Button>
                </div>

                {draft.title && <h3 className="text-base font-bold text-ink">{draft.title}</h3>}
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap bg-sand p-4 rounded-xl border border-line">
                  {draft.content}
                </p>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
