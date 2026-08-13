import { createFileRoute } from '@tanstack/react-router'
import { InboundsFeed } from '#/components/dashboard/InboundsFeed'
import { getActiveProjectId } from '#/lib/active-project'

export const Route = createFileRoute('/_protected/dashboard/inbounds')({
  component: InboundsPage,
})

function InboundsPage() {
  return <InboundsFeed activeProjectId={getActiveProjectId() || ''} />
}