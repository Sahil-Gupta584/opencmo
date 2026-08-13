import { Chip } from '@heroui/react'
import type { ChipProps } from '@heroui/react'

const PRIORITY_CONFIG: Record<string, { color: ChipProps['color']; label: string }> = {
  high: { color: 'danger', label: 'High' },
  medium: { color: 'warning', label: 'Medium' },
  low: { color: 'default', label: 'Low' },
}

interface PriorityChipProps {
  priority: string | null
}

export function PriorityChip({ priority }: PriorityChipProps) {
  const config = PRIORITY_CONFIG[priority ?? 'medium'] ?? PRIORITY_CONFIG.medium
  return (
    <Chip size="sm" variant="flat" color={config.color} classNames={{ content: 'font-semibold text-xs' }}>
      {config.label}
    </Chip>
  )
}
