import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button, Chip, Spinner } from '@heroui/react'
import { Input } from '#/components/Input'
import { Textarea } from '#/components/Textarea'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { setActiveProjectId } from '#/lib/active-project'
import {
  RiSparklingFill,
  RiAddLine,
  RiCheckLine,
  RiArrowRightLine,
  RiGlobalLine,
  RiRedditLine,
  RiFileTextLine,
  RiSettingsLine,
  RiErrorWarningLine,
  RiArrowLeftLine,
} from 'react-icons/ri'

export const Route = createFileRoute('/_protected/new')({
  component: NewProductPage,
})

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'Please enter your website URL')
    .transform((v) => normalizeUrl(v))
    .pipe(
      z.string().url({
        message: 'That doesn’t look like a valid website. Try e.g. https://yourproduct.com',
      }),
    ),
})
type UrlForm = z.infer<typeof urlSchema>

interface AnalyzedProductData {
  url: string
  name: string
  description: string
  targetAudience: string
  keywords: string[]
  targetSubreddits: string[]
  socialPostTypes?: string[]
}

const ANALYSIS_STEPS = [
  { label: 'Fetching your website', icon: RiGlobalLine },
  { label: 'Reading the landing page', icon: RiFileTextLine },
  { label: 'Understanding your product', icon: RiSparklingFill },
  { label: 'Finding relevant subreddits', icon: RiRedditLine },
  { label: 'Setting up your workspace', icon: RiSettingsLine },
]

function AnalyzingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1))
    }, 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-coral/15" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-coral text-white shadow-lg">
          <RiSparklingFill className="animate-pulse text-2xl" />
        </div>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-ink">Give us a moment</h2>
      <p className="mt-2 text-sm text-muted">We're reading your site and pulling out the essentials.</p>

      <div className="mt-10 w-full max-w-sm space-y-2.5">
        {ANALYSIS_STEPS.map(({ label, icon: Icon }, i) => {
          const done = i < step
          const active = i === step
          return (
            <div
              key={label}
              className={[
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300',
                done
                  ? 'border-emerald-200 bg-emerald-50'
                  : active
                    ? 'border-coral/30 bg-coral/10 shadow-sm'
                    : 'border-line bg-card opacity-50',
              ].join(' ')}
            >
              <Icon
                className={['shrink-0 text-base', done ? 'text-emerald-500' : active ? 'text-coral' : 'text-faint'].join(' ')}
              />
              <span
                className={[
                  'flex-1 text-sm font-medium',
                  done ? 'text-emerald-700' : active ? 'text-coral-dark' : 'text-muted',
                ].join(' ')}
              >
                {label}
              </span>
              {done ? (
                <RiCheckLine className="shrink-0 text-emerald-500" />
              ) : active ? (
                <Spinner size="sm" color="primary" />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NewProductPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [analyzedData, setAnalyzedData] = useState<AnalyzedProductData | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [newSubreddit, setNewSubreddit] = useState('')
  const [newPostType, setNewPostType] = useState('')

  const { data: apiConfig, isLoading: apiConfigLoading } = useQuery({
    ...orpc.getApiConfig.queryOptions(),
    staleTime: 0,
  })

  const hasAiKey = Boolean(
    apiConfig && (apiConfig.hasOpenaiKey || apiConfig.hasAnthropicKey || apiConfig.hasGeminiKey),
  )

  useEffect(() => {
    if (apiConfigLoading || hasAiKey) return
    void navigate({ to: '/settings', search: { tab: 'ai' } })
  }, [apiConfigLoading, hasAiKey, navigate])

  const {
    register: registerUrl,
    handleSubmit: handleSubmitUrl,
    formState: { errors: urlErrors },
  } = useForm<UrlForm>({ resolver: zodResolver(urlSchema) })

  // 1. Mutation to analyze product URL with AI
  const analyzeMutation = useMutation(
    orpc.analyzeProduct.mutationOptions({
      onSuccess: (data) => {
        setAnalyzeError(null)
        setAnalyzedData(data)
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.'
        setAnalyzeError(msg)
        console.error('🔴 Analysis failed:', err, 'Context:', { url: analyzeMutation.variables?.url })
      },
    }),
  )

  // 2. Mutation to save final product to DB
  const createMutation = useMutation(
    orpc.createProject.mutationOptions({
      onSuccess: (createdProject) => {
        setActiveProjectId(createdProject.id)
        queryClient.invalidateQueries()
        void navigate({ to: '/dashboard/inbounds' })
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : 'Failed to save your project. Please try again.'
        setCreateError(msg)
        console.error('🔴 Failed to save project:', err, 'Context:', { name: analyzedData?.name })
      },
    }),
  )

  if (apiConfigLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!hasAiKey) {
    return null
  }

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !analyzedData) return
    const kw = newKeyword.trim().toLowerCase()
    if (!analyzedData.keywords.includes(kw)) {
      setAnalyzedData({ ...analyzedData, keywords: [...analyzedData.keywords, kw] })
    }
    setNewKeyword('')
  }

  const handleRemoveKeyword = (kw: string) => {
    if (!analyzedData) return
    setAnalyzedData({ ...analyzedData, keywords: analyzedData.keywords.filter((k) => k !== kw) })
  }

  const handleAddSubreddit = () => {
    if (!newSubreddit.trim() || !analyzedData) return
    let sub = newSubreddit.trim()
    if (!sub.startsWith('r/')) sub = `r/${sub}`
    if (!analyzedData.targetSubreddits.includes(sub)) {
      setAnalyzedData({ ...analyzedData, targetSubreddits: [...analyzedData.targetSubreddits, sub] })
    }
    setNewSubreddit('')
  }

  const handleRemoveSubreddit = (sub: string) => {
    if (!analyzedData) return
    setAnalyzedData({
      ...analyzedData,
      targetSubreddits: analyzedData.targetSubreddits.filter((s) => s !== sub),
    })
  }

  const handleAddPostType = () => {
    if (!newPostType.trim() || !analyzedData) return
    const pt = newPostType.trim()
    const current = analyzedData.socialPostTypes || []
    if (!current.includes(pt)) {
      setAnalyzedData({ ...analyzedData, socialPostTypes: [...current, pt] })
    }
    setNewPostType('')
  }

  const handleRemovePostType = (pt: string) => {
    if (!analyzedData) return
    const current = analyzedData.socialPostTypes || []
    setAnalyzedData({ ...analyzedData, socialPostTypes: current.filter((p) => p !== pt) })
  }

  // Step 1: Input URL State
  if (!analyzedData && !analyzeMutation.isPending) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
        <div className="w-full max-w-xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-coral/10">
              <img src="/favicon.ico" alt="OpenCMO" className="h-9 w-9 object-cover" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Add a product</h1>
            <p className="mt-3 max-w-md text-base text-muted">
              Paste your website. We'll read it and set up your marketing workspace - name, audience, keywords, and where to post.
            </p>
          </div>

          {analyzeError && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <RiErrorWarningLine className="mt-0.5 shrink-0 text-lg text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700">Something went wrong</p>
                <p className="mt-0.5 text-sm text-red-600">{analyzeError}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmitUrl((data) => {
              setAnalyzeError(null)
              analyzeMutation.mutate({ url: data.url })
            })}
            className="mt-8 flex flex-col gap-4"
          >
            <Input
              {...registerUrl('url')}
              placeholder="yourproduct.com"
              label="Website"
              isInvalid={!!urlErrors.url}
              errorMessage={urlErrors.url?.message}
              size="lg"
            />

            <Button
              type="submit"
              color="primary"
              size="lg"
              className="mt-1 font-semibold"
              endContent={<RiArrowRightLine />}
            >
              Continue
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Step 2: Analyzing Loading State
  if (analyzeMutation.isPending) {
    return <AnalyzingState />
  }

  // Step 3: Interactive Review & Edit Form
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Review what we found</h1>
        <p className="mt-3 text-base text-muted">
          Looks right? Tweak anything, then we'll set up your workspace.
        </p>
      </div>

      {createError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <RiErrorWarningLine className="mt-0.5 shrink-0 text-lg text-red-500" />
          <p className="text-sm text-red-600">{createError}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Product Name
          </label>
          <Input
            value={analyzedData?.name || ''}
            onChange={(e) => analyzedData && setAnalyzedData({ ...analyzedData, name: e.target.value })}
          />
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Product Description
          </label>
          <Textarea
            minRows={3}
            value={analyzedData?.description || ''}
            onChange={(e) =>
              analyzedData && setAnalyzedData({ ...analyzedData, description: e.target.value })
            }
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Who it's for
          </label>
          <Textarea
            minRows={2}
            value={analyzedData?.targetAudience || ''}
            onChange={(e) =>
              analyzedData && setAnalyzedData({ ...analyzedData, targetAudience: e.target.value })
            }
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Keywords
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {analyzedData?.keywords.map((kw) => (
              <Chip key={kw} onClose={() => handleRemoveKeyword(kw)} variant="flat" color="secondary" size="sm">
                {kw}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              size="sm"
              placeholder="Add keyword (e.g. saas)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
            />
            <Button size="sm" variant="flat" onPress={handleAddKeyword} startContent={<RiAddLine />}>
              Add
            </Button>
          </div>
        </div>

        {/* Target Subreddits */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Subreddits
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {analyzedData?.targetSubreddits.map((sub) => (
              <Chip key={sub} onClose={() => handleRemoveSubreddit(sub)} variant="flat" color="warning" size="sm" startContent={<RiRedditLine />}>
                {sub}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              size="sm"
              placeholder="Add subreddit (e.g. r/SaaS)"
              value={newSubreddit}
              onChange={(e) => setNewSubreddit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubreddit())}
            />
            <Button size="sm" variant="flat" onPress={handleAddSubreddit} startContent={<RiAddLine />}>
              Add
            </Button>
          </div>
        </div>

        {/* Recommended Social Media Post Angles */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Post Ideas
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(analyzedData?.socialPostTypes || []).map((pt) => (
              <Chip key={pt} onClose={() => handleRemovePostType(pt)} variant="flat" color="success" size="sm">
                {pt}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              size="sm"
              placeholder="Add idea (e.g. Launch Story)"
              value={newPostType}
              onChange={(e) => setNewPostType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPostType())}
            />
            <Button size="sm" variant="flat" onPress={handleAddPostType} startContent={<RiAddLine />}>
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Done & Create Button */}
      <div className="mt-10 flex items-center justify-center gap-3">
        <Button
          variant="flat"
          onPress={() => setAnalyzedData(null)}
          isDisabled={createMutation.isPending}
          startContent={<RiArrowLeftLine />}
        >
          Back
        </Button>
        <Button
          color="primary"
          size="lg"
          className="px-8 font-semibold"
          isLoading={createMutation.isPending}
          onPress={() => analyzedData && createMutation.mutate(analyzedData)}
          startContent={!createMutation.isPending && <RiCheckLine />}
          endContent={!createMutation.isPending && <RiArrowRightLine />}
        >
          {createMutation.isPending ? 'Setting things up…' : 'Set up my workspace'}
        </Button>
      </div>
    </div>
  )
}
