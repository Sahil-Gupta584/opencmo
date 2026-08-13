import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  RadioGroup,
  Radio,
  Spinner,
  Tabs,
  Tab,
} from '@heroui/react'
import { Input } from '#/components/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  RiKeyLine,
  RiCheckLine,
  RiBankCardLine,
  RiNotification3Line,
} from 'react-icons/ri'

export const Route = createFileRoute('/_protected/settings')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: SettingsPage,
})

const apiConfigSchema = z.object({
  defaultProvider: z.enum(['openai', 'anthropic', 'gemini']),
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
  geminiKey: z.string().optional(),
})

type ApiConfigForm = z.infer<typeof apiConfigSchema>

function SettingsPage() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { tab } = Route.useSearch()
  const [selectedTab, setSelectedTab] = useState<string>(tab ?? 'ai')

  useEffect(() => {
    if (tab && tab !== selectedTab) {
      setSelectedTab(tab)
    }
  }, [tab, selectedTab])

  const { data: apiConfig, isLoading } = useQuery({
    ...orpc.getApiConfig.queryOptions(),
    staleTime: 0,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<ApiConfigForm>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      defaultProvider: 'gemini',
      openaiKey: '',
      anthropicKey: '',
      geminiKey: '',
    },
  })

  useEffect(() => {
    if (apiConfig) {
      if (apiConfig.defaultProvider) {
        setValue('defaultProvider', apiConfig.defaultProvider as any)
      }
    }
  }, [apiConfig, setValue])

  const selectedProvider = watch('defaultProvider')

  const saveConfigMutation = useMutation(
    orpc.saveApiConfig.mutationOptions({
      onSuccess: () => {
        setSaveSuccess(true)
        queryClient.invalidateQueries()
        setTimeout(() => setSaveSuccess(false), 3000)
      },
      onError: (err) => {
        console.error('🔴 Failed to save API config:', err)
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

  return (
    <div className="min-h-screen bg-sand">
      <header className="flex h-[56px] items-center justify-between border-b border-line bg-card px-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition no-underline">
            ← Back to Dashboard
          </Link>
        </div>
        <span className="text-sm font-bold text-ink">Settings</span>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Global Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Manage your AI provider keys and subscription
          </p>
        </div>

      <Tabs
        variant="underlined"
        color="primary"
        selectedKey={selectedTab}
        onSelectionChange={(key) => {
          setSelectedTab(String(key))
          void navigate({ search: { tab: String(key) }, replace: true })
        }}
        classNames={{
          tabList: 'gap-6 border-b border-line w-full mb-6',
          cursor: 'bg-coral',
          tab: 'px-0 font-medium',
        }}
      >
        {/* Tab 1: AI Provider */}
        <Tab
          key="ai"
          title={
            <div className="flex items-center gap-2">
              <RiKeyLine /> AI API Keys
            </div>
          }
        >
          <Card className="card-surface" radius="lg">
            <CardHeader className="px-6 pt-5 pb-0">
              <div>
                <h2 className="font-semibold text-ink">Bring Your Own AI Key (BYOK)</h2>
                <p className="text-xs text-muted mt-1">
                  Your keys are encrypted using AES-256 before storing. Select your primary provider.
                </p>
              </div>
            </CardHeader>
            <CardBody className="px-6 pb-6 pt-4">
              <form
                onSubmit={handleSubmit((data) => saveConfigMutation.mutate(data))}
                className="space-y-6"
              >
                {/* Provider selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-faint mb-3">
                    Default Provider
                  </label>
                  <RadioGroup
                    value={selectedProvider}
                    onValueChange={(val) => setValue('defaultProvider', val as any)}
                    orientation="horizontal"
                    classNames={{ wrapper: 'gap-4' }}
                  >
                    <Radio value="gemini" description="Google AI Studio (Recommended / Free tier)">
                      Gemini
                    </Radio>
                    <Radio value="openai" description="OpenAI GPT-4o-mini">
                      OpenAI
                    </Radio>
                    <Radio value="anthropic" description="Anthropic Claude 3.5 Haiku">
                      Anthropic
                    </Radio>
                  </RadioGroup>
                </div>

                {/* Gemini Key */}
                <div className={selectedProvider === 'gemini' ? 'block' : 'opacity-60'}>
                  <Input
                    label="Google Gemini API Key"
                    type="password"
                    placeholder={apiConfig?.hasGeminiKey ? '•••••••••••••••• (Key Configured)' : 'AIzaSy...'}
                    description="Get free key from aistudio.google.com"
                    {...register('geminiKey')}
                  />
                </div>

                {/* OpenAI Key */}
                <div className={selectedProvider === 'openai' ? 'block' : 'opacity-60'}>
                  <Input
                    label="OpenAI API Key"
                    type="password"
                    placeholder={apiConfig?.hasOpenaiKey ? '•••••••••••••••• (Key Configured)' : 'sk-proj-...'}
                    description="Get key from platform.openai.com"
                    {...register('openaiKey')}
                  />
                </div>

                {/* Anthropic Key */}
                <div className={selectedProvider === 'anthropic' ? 'block' : 'opacity-60'}>
                  <Input
                    label="Anthropic API Key"
                    type="password"
                    placeholder={apiConfig?.hasAnthropicKey ? '•••••••••••••••• (Key Configured)' : 'sk-ant-...'}
                    description="Get key from console.anthropic.com"
                    {...register('anthropicKey')}
                  />
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <RiCheckLine className="text-base" /> API configuration saved successfully!
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={saveConfigMutation.isPending}
                    className="font-medium"
                  >
                    Save AI Configuration
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </Tab>

        {/* Tab 2: Billing */}
        <Tab
          key="billing"
          title={
            <div className="flex items-center gap-2">
              <RiBankCardLine /> Billing & Plan
            </div>
          }
        >
          <Card className="card-surface" radius="lg">
            <CardBody className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">Current Plan</p>
                  <h3 className="text-xl font-extrabold text-ink mt-1">Indie Plan</h3>
                  <p className="text-sm text-muted">Bring your own AI API key</p>
                </div>
                <Chip color="primary" variant="flat" classNames={{ base: 'bg-coral/10', content: 'text-coral-dark font-semibold' }}>
                  $5 / month
                </Chip>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-ink text-sm">Plan Features</h4>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex items-center gap-2">
                    <RiCheckLine className="text-emerald-500" /> 200 Inbound Reddit leads / month
                  </li>
                  <li className="flex items-center gap-2">
                    <RiCheckLine className="text-emerald-500" /> 10 Subreddits monitored
                  </li>
                  <li className="flex items-center gap-2">
                    <RiCheckLine className="text-emerald-500" /> Unlimited Outbound AI drafts
                  </li>
                  <li className="flex items-center gap-2">
                    <RiCheckLine className="text-emerald-500" /> Ban Sentinel risk scoring
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Button variant="bordered" className="font-medium">
                  Manage Subscription (Dodo Payments)
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* Tab 3: Notifications */}
        <Tab
          key="notifications"
          title={
            <div className="flex items-center gap-2">
              <RiNotification3Line /> Notifications
            </div>
          }
        >
          <Card className="card-surface" radius="lg">
            <CardBody className="p-6 space-y-4">
              <h3 className="font-semibold text-ink">Email Preferences</h3>
              <p className="text-sm text-muted">
                Receive notifications when high buying-intent threads are discovered for your products.
              </p>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 text-sm text-muted cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-coral focus:ring-coral" />
                  Email me when high intent leads (&gt;70 score) are found
                </label>
                <label className="flex items-center gap-3 text-sm text-muted cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-coral focus:ring-coral" />
                  Weekly marketing digest summary
                </label>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
      </div>
    </div>
  )
}
