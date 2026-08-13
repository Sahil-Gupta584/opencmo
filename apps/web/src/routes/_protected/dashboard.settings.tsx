import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, CardBody, CardHeader, Chip, RadioGroup, Radio, Spinner, Tabs, Tab } from '@heroui/react'
import { Input } from '#/components/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RiKeyLine, RiCheckLine, RiBankCardLine, RiLock2Line } from 'react-icons/ri'

export const Route = createFileRoute('/_protected/dashboard/settings')({
  component: DashboardSettingsPage,
})

const apiConfigSchema = z.object({
  defaultProvider: z.enum(['openai', 'anthropic', 'gemini']),
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
  geminiKey: z.string().optional(),
})

type ApiConfigForm = z.infer<typeof apiConfigSchema>

const PROVIDERS = [
  { value: 'gemini', label: 'Gemini', desc: 'Google AI Studio (Free tier)' },
  { value: 'openai', label: 'OpenAI', desc: 'GPT-4o-mini' },
  { value: 'anthropic', label: 'Anthropic', desc: 'Claude 3.5 Haiku' },
] as const

function DashboardSettingsPage() {
  const queryClient = useQueryClient()
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: apiConfig, isLoading } = useQuery({
    ...orpc.getApiConfig.queryOptions(),
    staleTime: 0,
  })

  const { register, handleSubmit, setValue, watch } = useForm<ApiConfigForm>({
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
      if (apiConfig.hasOpenaiKey) setValue('openaiKey', '••••••••••••••••')
      if (apiConfig.hasAnthropicKey) setValue('anthropicKey', '••••••••••••••••')
      if (apiConfig.hasGeminiKey) setValue('geminiKey', '••••••••••••••••')
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

  const keyFieldFor = (provider: 'gemini' | 'openai' | 'anthropic') => ({
    className: selectedProvider === provider ? 'block' : 'opacity-50',
  })

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your AI provider keys and subscription</p>
      </div>

      <Tabs
        variant="underlined"
        color="primary"
        classNames={{
          tabList: 'gap-6 border-b border-line w-full mb-6',
          cursor: 'bg-coral',
          tab: 'px-0 font-medium',
        }}
      >
        <Tab
          key="api-keys"
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
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <RiLock2Line className="shrink-0" /> Keys are encrypted with AES-256 before storing. Pick your primary provider.
                </p>
              </div>
            </CardHeader>
            <CardBody className="px-6 pb-6 pt-4">
              <form onSubmit={handleSubmit((data) => saveConfigMutation.mutate(data))} className="space-y-6">
                <div>
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-faint">
                    Default Provider
                  </label>
                  <RadioGroup
                    value={selectedProvider}
                    onValueChange={(val) => setValue('defaultProvider', val as any)}
                    orientation="horizontal"
                    classNames={{ wrapper: 'gap-4' }}
                  >
                    {PROVIDERS.map((p) => (
                      <Radio key={p.value} value={p.value} description={p.desc}>
                        {p.label}
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4 border-t border-line pt-6">
                  <div {...keyFieldFor('gemini')}>
                    <Input
                      label="Google Gemini API Key"
                      type="password"
                      placeholder={apiConfig?.hasGeminiKey ? '•••••••••••••••• (Key Configured)' : 'AIzaSy...'}
                      description="Get a free key from aistudio.google.com"
                      {...register('geminiKey')}
                    />
                  </div>
                  <div {...keyFieldFor('openai')}>
                    <Input
                      label="OpenAI API Key"
                      type="password"
                      placeholder={apiConfig?.hasOpenaiKey ? '•••••••••••••••• (Key Configured)' : 'sk-proj-...'}
                      description="Get a key from platform.openai.com"
                      {...register('openaiKey')}
                    />
                  </div>
                  <div {...keyFieldFor('anthropic')}>
                    <Input
                      label="Anthropic API Key"
                      type="password"
                      placeholder={apiConfig?.hasAnthropicKey ? '•••••••••••••••• (Key Configured)' : 'sk-ant-...'}
                      description="Get a key from console.anthropic.com"
                      {...register('anthropicKey')}
                    />
                  </div>
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-600">
                    <RiCheckLine className="text-base" /> API configuration saved successfully!
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={saveConfigMutation.isPending}
                    className="font-medium px-8"
                  >
                    Save AI Configuration
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="billing"
          title={
            <div className="flex items-center gap-2">
              <RiBankCardLine /> Subscription & Billing
            </div>
          }
        >
          <Card className="card-surface" radius="lg">
            <CardBody className="space-y-6 p-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">Current Plan</p>
                  <h3 className="mt-1 text-xl font-extrabold text-ink">BYOK Plan</h3>
                  <p className="text-sm text-muted">Bring your own AI API key</p>
                </div>
                <Chip color="primary" variant="flat" classNames={{ base: 'bg-coral/10', content: 'text-coral-dark font-semibold' }}>
                  $5 / month
                </Chip>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-ink">Plan Features</h4>
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

              <p className="rounded-lg bg-sand p-3 text-xs text-muted">
                Need automated remote background scanning? Upgrade to the hosted plan.
              </p>

              <div className="pt-1">
                <Button color="primary" href="/pricing" as="a" className="font-medium">
                  View Pricing Plans
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}
