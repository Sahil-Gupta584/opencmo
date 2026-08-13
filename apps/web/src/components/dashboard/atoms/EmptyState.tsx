import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  iconWrapperClassName?: string
}

export function EmptyState({ icon, title, description, iconWrapperClassName }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center card-surface py-16 text-center">
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10 text-coral ${iconWrapperClassName ?? ''}`}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-muted mb-6 max-w-sm">{description}</p>
    </div>
  )
}