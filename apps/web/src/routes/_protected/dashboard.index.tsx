import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Spinner } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useEffect } from 'react'

export const Route = createFileRoute('/_protected/dashboard/')({
  component: DashboardIndexPage,
})

function DashboardIndexPage() {
  const navigate = useNavigate()

  const { data: projects = [], isLoading } = useQuery({
    ...orpc.listProjects.queryOptions(),
    staleTime: 0,
  })

  useEffect(() => {
    if (isLoading) return

    if (projects.length === 0) {
      void navigate({ to: '/new', replace: true })
      return
    }

    // No projectId in the URL yet, so default the user to their first project.
    void navigate({
      to: '/dashboard/inbounds',
      search: { projectId: projects[0].id },
      replace: true,
    })
  }, [isLoading, projects, navigate])

  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}