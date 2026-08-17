import { Button, Card, CardBody } from '@heroui/react'
import { useState } from 'react'
import type { RedditThread } from '@repo/database'
import { RiExternalLinkLine, RiCheckLine, RiFileCopyLine, RiMagicLine, RiUserLine, RiTimeLine } from 'react-icons/ri'
import { PriorityChip } from './PriorityChip'
import { ChannelChip } from './ChannelChip'

interface ThreadCardProps {
  thread: RedditThread
  readOnly?: boolean
  isReplying?: boolean
  isUpdating?: boolean
  onGenerateReply?: (thread: RedditThread) => void
  onToggleStatus?: (thread: RedditThread) => void
}

export function ThreadCard({
  thread,
  readOnly = false,
  isReplying = false,
  isUpdating = false,
  onGenerateReply,
  onToggleStatus,
}: ThreadCardProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (key: string, text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Card className="card-surface card-surface-hover" radius="lg">
      <CardBody className="p-5 space-y-4">
        {/* Top metadata */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-faint">
          <div className="flex items-center gap-2">
            <PriorityChip priority={thread.priority} />
            <ChannelChip channel={thread.channel} subreddit={thread.subreddit} />
            {thread.author && (
              <span className="flex items-center gap-1">
                <RiUserLine /> {thread.author}
              </span>
            )}
            {thread.redditCreatedAt && (
              <span className="flex items-center gap-1">
                <RiTimeLine /> {new Date(thread.redditCreatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={thread.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-coral visited:text-purple-600 hover:underline flex items-center gap-1 font-medium no-underline"
            >
              View Post <RiExternalLinkLine />
            </a>
          </div>
        </div>

        {/* Title & snippet */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-ink leading-snug">{thread.title}</h3>
            {thread.title && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="shrink-0 h-7 w-7 text-faint"
                startContent={copied === 'title' ? <RiCheckLine /> : <RiFileCopyLine />}
                onPress={() => handleCopy('title', thread.title)}
                aria-label="Copy title"
              />
            )}
          </div>
          {thread.body && (
            <div className="flex items-start justify-between gap-2 bg-sand p-3 rounded-lg border border-line">
              <p className="text-sm text-muted leading-relaxed">{thread.body}</p>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="shrink-0 h-7 w-7 text-faint"
                startContent={copied === 'body' ? <RiCheckLine /> : <RiFileCopyLine />}
                onPress={() => handleCopy('body', thread.body ?? '')}
                aria-label="Copy body"
              />
            </div>
          )}
        </div>

        {/* Generated reply */}
        {thread.generatedReply ? (
          <div className="space-y-2 rounded-xl bg-coral/10 p-4 border border-coral/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-coral-dark flex items-center gap-1.5">
                <RiMagicLine /> Generated Reply
              </span>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                className="h-7 text-xs font-semibold"
                startContent={copied === 'reply' ? <RiCheckLine /> : <RiFileCopyLine />}
                onPress={() => handleCopy('reply', thread.generatedReply ?? '')}
              >
                {copied === 'reply' ? 'Copied!' : 'Copy Reply'}
              </Button>
            </div>
            <p className="text-sm text-ink leading-relaxed font-normal">{thread.generatedReply}</p>
            {!readOnly && (
              <div className="flex items-center justify-end pt-2 border-t border-coral/15">
                <Button
                  size="sm"
                  variant="light"
                  color={thread.isDone ? 'default' : 'success'}
                  isLoading={isUpdating}
                  startContent={!isUpdating && <RiCheckLine />}
                  onPress={() => onToggleStatus?.(thread)}
                  className="font-medium"
                >
                  {thread.isDone ? 'Re-open' : 'Mark as Completed'}
                </Button>
              </div>
            )}
          </div>
        ) : readOnly ? (
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <span className="text-xs text-faint">Read-only preview</span>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              isLoading={isReplying}
              startContent={!isReplying && <RiMagicLine />}
              onPress={() => onGenerateReply?.(thread)}
              className="font-semibold"
            >
              {isReplying ? 'AI Writing Reply…' : 'Generate Reply'}
            </Button>

            <Button
              size="sm"
              variant="light"
              color={thread.isDone ? 'default' : 'success'}
              isLoading={isUpdating}
              startContent={!isUpdating && <RiCheckLine />}
              onPress={() => onToggleStatus?.(thread)}
              className="font-medium"
            >
              {thread.isDone ? 'Re-open' : 'Mark as Completed'}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  )
}