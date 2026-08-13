import { Card, CardBody, Chip, Button } from '@heroui/react'
import { useState } from 'react'
import type { ContentDraft } from '@repo/database'
import { RiFileCopyLine, RiCheckLine } from 'react-icons/ri'

interface DraftCardProps {
  draft: ContentDraft
}

export function DraftCard({ draft }: DraftCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`${draft.title ?? ''}\n\n${draft.content}`.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="card-surface" radius="lg">
      <CardBody className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Chip size="sm" variant="flat" color="success" className="font-semibold">
            Social
          </Chip>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={copied ? <RiCheckLine /> : <RiFileCopyLine />}
            onPress={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy Post'}
          </Button>
        </div>

        {draft.title && <h3 className="text-base font-bold text-ink">{draft.title}</h3>}
        <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap bg-sand p-4 rounded-xl border border-line">
          {draft.content}
        </p>
      </CardBody>
    </Card>
  )
}