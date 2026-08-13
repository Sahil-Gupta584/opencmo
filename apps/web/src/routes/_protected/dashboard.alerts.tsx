import { createFileRoute } from '@tanstack/react-router'
import { AlertsBoard } from '#/components/dashboard/AlertsBoard'

export const Route = createFileRoute('/_protected/dashboard/alerts')({
  component: AlertsPage,
})

function AlertsPage() {
  return <AlertsBoard />
}