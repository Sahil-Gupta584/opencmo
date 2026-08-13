import { Button } from '@heroui/react'
import { RiRedditLine, RiTwitterXLine, RiLinkedinBoxLine } from 'react-icons/ri'

export type ChannelKey = 'reddit' | 'twitter' | 'linkedin'

interface ChannelFilterPillsProps {
  counts: { reddit: number; twitter: number; linkedin: number }
  selected: ChannelKey
  onSelect: (channel: ChannelKey) => void
}

export function ChannelFilterPills({ counts, selected, onSelect }: ChannelFilterPillsProps) {
  const pills: {
    key: ChannelKey
    label: string
    icon: React.ReactNode
    iconClass: string
  }[] = [
    {
      key: 'reddit',
      label: `Reddit${counts.reddit ? ` (${counts.reddit})` : ''}`,
      icon: (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-orange-500">
          <RiRedditLine className="text-[10px]" />
        </span>
      ),
      iconClass: 'text-orange-500',
    },
    {
      key: 'twitter',
      label: `X (Twitter)${counts.twitter ? ` (${counts.twitter})` : ''}`,
      icon: <RiTwitterXLine className="text-xs text-ink" />,
      iconClass: 'text-ink',
    },
    {
      key: 'linkedin',
      label: `LinkedIn${counts.linkedin ? ` (${counts.linkedin})` : ''}`,
      icon: <RiLinkedinBoxLine className="text-xs text-blue-600" />,
      iconClass: 'text-blue-600',
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pills.map((p) => (
        <Button
          key={p.key}
          size="sm"
          variant={selected === p.key ? 'solid' : 'flat'}
          color={selected === p.key ? 'primary' : 'default'}
          startContent={
            <span className={`text-xs ${selected === p.key ? 'text-white' : p.iconClass}`}>{p.icon}</span>
          }
          onPress={() => onSelect(p.key)}
          className="font-medium text-xs h-8"
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}