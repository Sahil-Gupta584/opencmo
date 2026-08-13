import { Button, Card, CardBody, CardHeader, Checkbox, Chip, Input, Spinner } from '@heroui/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useEffect, useState } from 'react'
import { RiCheckLine, RiNotification3Line, RiAddLine, RiMailLine } from 'react-icons/ri'
import { FaWhatsapp } from 'react-icons/fa6'
import { SiSlack, SiDiscord } from 'react-icons/si'

const QUICK_CHANNELS = [
  { key: 'Email', label: 'Email', icon: RiMailLine },
  { key: 'WhatsApp', label: 'WhatsApp', icon: FaWhatsapp },
  { key: 'Slack', label: 'Slack', icon: SiSlack },
  { key: 'Discord', label: 'Discord', icon: SiDiscord },
] as const

export function AlertsBoard() {
  const { data: pref, isLoading } = useQuery({
    ...orpc.getAlertPref.queryOptions(),
    staleTime: 0,
  })

  const [notifyInbounds, setNotifyInbounds] = useState(true)
  const [notifyOutbound, setNotifyOutbound] = useState(true)
  const [channels, setChannels] = useState<string[]>(['Email'])
  const [customChannel, setCustomChannel] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (pref) {
      setNotifyInbounds(pref.notifyInbounds)
      setNotifyOutbound(pref.notifyOutbound)
      setChannels(pref.channels.length ? pref.channels : ['Email'])
    }
  }, [pref])

  const savePrefMutation = useMutation(
    orpc.saveAlertPref.mutationOptions({
      onSuccess: () => {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      },
      onError: (err) => {
        console.error('🔴 Failed to save alert preferences:', err)
      },
    }),
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const toggleChannel = (channel: string) => {
    setChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]))
  }

  const addCustomChannel = () => {
    const name = customChannel.trim()
    if (name && !channels.includes(name)) {
      setChannels((prev) => [...prev, name])
    }
    setCustomChannel('')
  }

  const handleSave = () => {
    savePrefMutation.mutate({ notifyInbounds, notifyOutbound, channels })
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Alerts</h1>
        <p className="mt-1 text-sm text-muted">
          Get notified as soon as someone shares a problem your product solves.
        </p>
      </div>

      <div className="space-y-6">
        {/* Email notifications */}
        <Card className="card-surface" radius="lg">
          <CardHeader className="px-6 pt-5 pb-0">
            <div>
              <h2 className="font-semibold text-ink">Notifications</h2>
              <p className="mt-1 text-xs text-muted">
                Choose what you want to be notified about, and which channels to use.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 px-6 pb-6 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-sand/60 p-4">
                <Checkbox
                  isSelected={notifyInbounds}
                  onValueChange={setNotifyInbounds}
                  classNames={{ label: 'text-sm text-ink font-medium' }}
                >
                  Inbound leads
                </Checkbox>
                <p className="mt-1 text-xs text-muted">
                  High buying-intent threads found for your products.
                </p>
              </div>
              <div className="rounded-xl border border-line bg-sand/60 p-4">
                <Checkbox
                  isSelected={notifyOutbound}
                  onValueChange={setNotifyOutbound}
                  classNames={{ label: 'text-sm text-ink font-medium' }}
                >
                  Outbound drafts
                </Checkbox>
                <p className="mt-1 text-xs text-muted">
                  When your daily content batch is ready to review and post.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Request more channels */}
        <Card className="card-surface" radius="lg">
          <CardHeader className="px-6 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <RiNotification3Line className="text-coral text-lg" />
              <div>
                <h2 className="font-semibold text-ink">Request more channels</h2>
                <p className="mt-1 text-xs text-muted">
                  Want alerts somewhere besides email? Tell us which channels to add.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 px-6 pb-6 pt-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_CHANNELS.map((channel) => {
                const active = channels.includes(channel.key)
                return (
                  <Chip
                    key={channel.key}
                    variant="flat"
                    onClick={() => toggleChannel(channel.key)}
                    className={`cursor-pointer transition ${
                      active ? 'bg-coral text-white' : 'bg-white border border-line text-ink hover:border-coral/50'
                    }`}
                    startContent={<channel.icon className="text-sm" />}
                  >
                    {channel.label}
                  </Chip>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={customChannel}
                onValueChange={setCustomChannel}
                placeholder="Or type a custom channel (e.g. Telegram, SMS)"
                className="max-w-md"
              />
              <Button
                size="sm"
                variant="flat"
                color="primary"
                isIconOnly
                onPress={addCustomChannel}
                aria-label="Add custom channel"
              >
                <RiAddLine />
              </Button>
            </div>

            {channels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {channels.map((channel) => (
                  <Chip
                    key={channel}
                    size="sm"
                    variant="flat"
                    onClose={() => toggleChannel(channel)}
                    classNames={{ base: 'bg-coral/10', content: 'text-coral-dark font-medium' }}
                  >
                    {channel}
                  </Chip>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-600">
            <RiCheckLine className="text-base" /> Alert preferences saved!
          </div>
        )}

        <div className="flex justify-end">
          <Button
            color="primary"
            isLoading={savePrefMutation.isPending}
            onPress={handleSave}
            className="bg-coral font-medium px-8"
          >
            Save Alert Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}