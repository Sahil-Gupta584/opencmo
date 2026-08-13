import { Chip } from '@heroui/react'
import { RiRedditLine, RiTwitterXLine, RiLinkedinBoxLine } from 'react-icons/ri'

interface ChannelChipProps {
  channel: string
  subreddit?: string
}

export function ChannelChip({ channel, subreddit }: ChannelChipProps) {
  if (channel === 'twitter') {
    return (
      <Chip
        size="sm"
        variant="flat"
        classNames={{ base: 'bg-sand', content: 'text-ink font-medium text-xs flex items-center gap-1' }}
      >
        <RiTwitterXLine className="text-ink" /> X (Twitter)
      </Chip>
    )
  }
  if (channel === 'linkedin') {
    return (
      <Chip
        size="sm"
        variant="flat"
        classNames={{ base: 'bg-blue-50', content: 'text-blue-700 font-medium text-xs flex items-center gap-1' }}
      >
        <RiLinkedinBoxLine className="text-blue-600" /> LinkedIn
      </Chip>
    )
  }
  return (
    <Chip
      size="sm"
      variant="flat"
      classNames={{ base: 'bg-orange-50', content: 'text-orange-700 font-medium text-xs flex items-center gap-1' }}
    >
      <RiRedditLine className="text-orange-500" /> {subreddit ?? 'Reddit'}
    </Chip>
  )
}