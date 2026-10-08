import { createFileRoute } from '@tanstack/react-router'
import { InboundsFeed } from '#/components/dashboard/InboundsFeed'
import { validateProjectSearch } from '#/lib/project-search'

export const Route = createFileRoute('/_protected/dashboard/inbounds')({
  validateSearch: validateProjectSearch,
  component: InboundsPage,
})

function InboundsPage() {
  const { projectId } = Route.useSearch()
  return <InboundsFeed activeProjectId={projectId ?? ''} />
}