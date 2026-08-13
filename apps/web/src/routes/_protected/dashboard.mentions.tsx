import { createFileRoute } from '@tanstack/react-router'
import { MentionsBoard } from '#/components/dashboard/MentionsBoard'
import { getActiveProjectId } from '#/lib/active-project'

export const Route = createFileRoute('/_protected/dashboard/mentions')({
  component: MentionsPage,
})

function MentionsPage() {
  return <MentionsBoard activeProjectId={getActiveProjectId() || ''} />
}