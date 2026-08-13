import { Card, CardBody, Chip } from '@heroui/react'
import type { ProjectSubreddit } from '@repo/database'
import { RiShieldCheckLine, RiExternalLinkLine } from 'react-icons/ri'

interface SubredditCardProps {
  subreddit: ProjectSubreddit
}

export function SubredditCard({ subreddit }: SubredditCardProps) {
  const cleanName = subreddit.name.replace(/^r\//, '')
  return (
    <Card className="card-surface card-surface-hover" radius="lg">
      <CardBody className="p-5 flex flex-col justify-between h-full gap-4">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 font-bold text-sm">
                r/
              </div>
              <h3 className="font-bold text-ink text-base">{subreddit.name}</h3>
            </div>
            <a
              href={`https://reddit.com/r/${cleanName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-coral hover:underline flex items-center gap-1 font-medium no-underline"
            >
              Reddit <RiExternalLinkLine />
            </a>
          </div>

          <p className="text-sm text-muted leading-relaxed line-clamp-3">
            {subreddit.description || 'Target community for indie hackers, founders, and creators.'}
          </p>
        </div>

        <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted font-medium">
            <RiShieldCheckLine className="text-faint" />
            Active community
          </div>

          <Chip size="sm" variant="flat" classNames={{ base: 'bg-emerald-50', content: 'text-emerald-700 font-medium text-xs' }}>
            <span className="flex items-center gap-1">
              <RiShieldCheckLine /> {subreddit.relevance || 95}% Relevance
            </span>
          </Chip>
        </div>
      </CardBody>
    </Card>
  )
}