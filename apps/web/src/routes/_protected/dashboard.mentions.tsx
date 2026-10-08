import { createFileRoute } from '@tanstack/react-router'
import { MentionsBoard } from '#/components/dashboard/MentionsBoard'
import { validateProjectSearch } from '#/lib/project-search'

export const Route = createFileRoute('/_protected/dashboard/mentions')({
  validateSearch: validateProjectSearch,
  component: MentionsPage,
})

function MentionsPage() {
  const { projectId } = Route.useSearch()
  return <MentionsBoard activeProjectId={projectId ?? ''} />
}